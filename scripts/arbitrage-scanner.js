/**
 * Arbitrage Scanner: 42space vs Polymarket
 * 
 * 扫描两个平台的相同事件，计算价差，发现套利机会
 * 使用本地 normalized snapshot 数据
 * 
 * 运行: node scripts/arbitrage-scanner.js
 */

const fs = require('fs');
const path = require('path');

// Discord webhook (从环境变量或配置文件读取)
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || '';

/**
 * 获取最新的 normalized snapshot
 */
function getLatestSnapshot() {
  const outputsDir = path.join(__dirname, '../knowledge/outputs');
  
  if (!fs.existsSync(outputsDir)) {
    console.error('Outputs directory not found');
    return [];
  }
  
  const files = fs.readdirSync(outputsDir)
    .filter(f => f.match(/^markets-normalized-\d{4}-\d{2}-\d{2}\.json$/))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('No snapshot files found');
    return [];
  }
  
  const latestFile = path.join(outputsDir, files[0]);
  console.log(`Using snapshot: ${files[0]}`);
  
  return JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
}

/**
 * 计算 42space Pari-mutuel 隐含概率
 * 注意: Pari-mutuel 的概率是基于当前池子比例，而非固定价格
 */
function calculate42spaceProbabilities(market) {
  if (!market.outcomes) return {};
  
  const totalVolume = market.outcomes.reduce((sum, o) => sum + (o.volume || 0), 0);
  if (totalVolume === 0) return {};
  
  const probs = {};
  market.outcomes.forEach(o => {
    probs[o.symbol] = (o.volume / totalVolume);
  });
  return probs;
}

/**
 * 从 Polymarket 获取事件数据
 * 使用 web scraping 或 API
 */
async function fetchPolymarketEvent(eventTitle) {
  // 提取关键词
  const keywords = eventTitle
    .replace(/[?]/g, '')
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 5);
  
  // 尝试通过 Google 搜索或直接构造 URL
  // Polymarket 事件 URL 格式: /event/{slug}
  const slug = keywords.join('-').substring(0, 50);
  
  // 返回搜索关键词，让外部处理
  return { keywords, slug, searchTerm: eventTitle };
}

/**
 * 手动定义的已知 Polymarket 事件映射
 * 因为 API 不稳定，使用预设映射
 */
const KNOWN_POLYMARKET_EVENTS = {
  'bank of japan decision in march 2026': {
    url: 'https://polymarket.com/event/bank-of-japan-decision-in-march',
    outcomes: {
      'no change': 0.948,
      '25 bps increase': 0.04,
      'decrease rates': 0.005,
      '50+ bps increase': 0.005
    }
  },
  'bank of japan decision in april': {
    url: 'https://polymarket.com/event/bank-of-japan-decision-in-april',
    outcomes: {
      'no change': 0.90,
      '25 bps increase': 0.08,
      'decrease rates': 0.01,
      '50+ bps increase': 0.01
    }
  },
  'gold price range': {
    url: 'https://polymarket.com/event/gold-price-range-mar-5',
    outcomes: {}
  }
};

/**
 * 匹配 42space 事件到 Polymarket
 */
function matchToPolymarket(ftMarket) {
  const title = ftMarket.title?.toLowerCase() || ftMarket.question?.toLowerCase() || '';
  
  // 直接匹配
  for (const key of Object.keys(KNOWN_POLYMARKET_EVENTS)) {
    if (title.includes(key) || key.includes(title)) {
      return KNOWN_POLYMARKET_EVENTS[key];
    }
  }
  
  // 模糊匹配
  if (title.includes('bank of japan') || title.includes('boj')) {
    return KNOWN_POLYMARKET_EVENTS['bank of japan decision in march 2026'];
  }
  
  if (title.includes('gold price')) {
    return KNOWN_POLYMARKET_EVENTS['gold price range'];
  }
  
  return null;
}

/**
 * 对齐 outcomes 并计算价差
 */
function calculateDifferences(ftMarket, polyData) {
  const ftProbs = calculate42spaceProbabilities(ftMarket);
  const polyProbs = polyData?.outcomes || {};
  
  const comparisons = [];
  
  // 获取 ft outcomes
  const ftKeys = Object.keys(ftProbs);
  
  for (const ftKey of ftKeys) {
    const ftKeyLower = ftKey.toLowerCase();
    let matched = null;
    let diff = 0;
    
    // 尝试匹配 poly outcome
    for (const polyKey of Object.keys(polyProbs)) {
      const polyKeyLower = polyKey.toLowerCase();
      
      // No change
      if (ftKeyLower.includes('no change') && polyKeyLower.includes('no change')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
        break;
      }
      
      // Increase
      if (ftKeyLower.includes('increase') && polyKeyLower.includes('increase')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
      }
      
      // Decrease
      if (ftKeyLower.includes('decrease') && polyKeyLower.includes('decrease')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
      }
    }
    
    if (matched) {
      comparisons.push({
        outcome: ftKey,
        ftProb: (ftProbs[ftKey] * 100).toFixed(1),
        polyProb: (polyProbs[matched] * 100).toFixed(1),
        diff: (diff * 100).toFixed(1)
      });
    }
  }
  
  return comparisons;
}

/**
 * 发送 Discord 通知
 */
async function sendDiscordNotification(opportunities) {
  if (!DISCORD_WEBHOOK || opportunities.length === 0) {
    console.log('No Discord webhook configured or no opportunities found');
    return;
  }
  
  const embed = {
    embeds: [{
      title: '🚨 42space vs Polymarket 套利机会',
      color: 0x00ff00,
      description: `发现 ${opportunities.length} 个潜在套利机会`,
      fields: opportunities.map(opp => ({
        name: opp.ftMarket.title || opp.ftMarket.question,
        value: opp.comparisons
          .map(c => `• ${c.outcome}: 42space ${c.ftProb}% vs Poly ${c.polyProb}% (差 ${c.diff}%)`)
          .join('\n'),
        inline: false
      })),
      timestamp: new Date().toISOString()
    }]
  };
  
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });
    console.log('Discord notification sent');
  } catch (e) {
    console.error('Failed to send Discord notification:', e.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 42space vs Polymarket Arbitrage Scanner ===\n');
  
  // 1. 获取 42space snapshot
  console.log('Loading 42space snapshot...');
  const ftMarkets = getLatestSnapshot();
  console.log(`Found ${ftMarkets.length} markets in snapshot\n`);
  
  // 2. 筛选高流动性市场
  const liquidMarkets = ftMarkets.filter(m => 
    m.volume?.total > 100 || m.outcomes?.reduce((s, o) => s + (o.volume || 0), 0) > 100
  );
  console.log(`Liquid markets (> $100): ${liquidMarkets.length}\n`);
  
  // 3. 扫描每个市场
  const opportunities = [];
  
  for (const market of liquidMarkets) {
    const title = market.title || market.question;
    console.log(`Checking: ${title}`);
    
    // 匹配 Polymarket
    const polyData = matchToPolymarket(market);
    
    if (!polyData) {
      console.log('  -> No Polymarket match found\n');
      continue;
    }
    
    // 计算价差
    const comparisons = calculateDifferences(market, polyData);
    
    if (comparisons.length === 0) {
      console.log('  -> No comparable outcomes\n');
      continue;
    }
    
    // 检查是否有显著差异 (>10%)
    const maxDiff = comparisons.reduce((max, c) => Math.max(max, parseFloat(c.diff)), 0);
    
    if (maxDiff > 10) {
      console.log(`  -> 🚨 ARBITRAGE OPPORTUNITY! Max diff: ${maxDiff}%\n`);
      opportunities.push({
        ftMarket: market,
        polyUrl: polyData.url,
        comparisons,
        maxDiff
      });
    } else {
      console.log(`  -> Diff: ${maxDiff}%\n`);
    }
  }
  
  // 4. 输出结果
  console.log('\n=== Summary ===');
  console.log(`Opportunities found: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    console.log('\nArbitrage Opportunities:');
    opportunities.forEach((opp, i) => {
      console.log(`\n${i + 1}. ${opp.ftMarket.title || opp.ftMarket.question}`);
      console.log(`   Polymarket: ${opp.polyUrl}`);
      console.log(`   Max diff: ${opp.maxDiff}%`);
    });
  }
  
  // 5. 发送 Discord 通知
  await sendDiscordNotification(opportunities);
  
  // 6. 保存结果
  const outputPath = path.join(__dirname, '../knowledge/outputs/arbitrage-scan-latest.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    opportunities,
    summary: {
      totalMarkets: ftMarkets.length,
      liquidMarkets: liquidMarkets.length,
      opportunities: opportunities.length
    }
  }, null, 2));
  
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
