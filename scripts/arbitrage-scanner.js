/**
 * Arbitrage Scanner: 42space vs Polymarket
 * 
 * 使用本地 snapshot + 预设映射对比
 * 子代理发现机会时用 web_fetch 动态补充
 * 
 * 运行: node scripts/arbitrage-scanner.js
 */

const fs = require('fs');
const path = require('path');

// Discord webhook
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || '';
const ARBITRAGE_THRESHOLD = 10;

/**
 * 获取最新的 normalized snapshot
 */
function getLatestSnapshot() {
  const outputsDir = path.join(__dirname, '../knowledge/outputs');
  
  if (!fs.existsSync(outputsDir)) return [];
  
  const files = fs.readdirSync(outputsDir)
    .filter(f => f.match(/^markets-normalized-\d{4}-\d{2}-\d{2}\.json$/))
    .sort().reverse();
  
  if (files.length === 0) return [];
  
  console.log(`Using snapshot: ${files[0]}`);
  return JSON.parse(fs.readFileSync(path.join(outputsDir, files[0]), 'utf-8'));
}

/**
 * 42space 概率计算 (基于池子 volume)
 */
function calculate42spaceProbabilities(market) {
  if (!market.outcomes) return {};
  
  const total = market.outcomes.reduce((sum, o) => sum + (o.volume || 0), 0);
  if (total === 0) return {};
  
  const probs = {};
  market.outcomes.forEach(o => {
    probs[o.symbol] = o.volume / total;
  });
  return probs;
}

/**
 * 已知 Polymarket 事件映射
 * 由子代理动态更新
 */
const KNOWN_POLYMARKET_EVENTS = {
  'bank of japan decision in march': {
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
    }
  }
};

/**
 * 匹配 42space 事件到 Polymarket
 */
function matchToPolymarket(ftMarket) {
  const title = (ftMarket.title || ftMarket.question || '').toLowerCase();
  
  // 直接匹配
  for (const key of Object.keys(KNOWN_POLYMARKET_EVENTS)) {
    if (title.includes(key) || key.includes(title)) {
      return KNOWN_POLYMARKET_EVENTS[key];
    }
  }
  
  // 模糊匹配
  if (title.includes('bank of japan') || title.includes('boj')) {
    return KNOWN_POLYMARKET_EVENTS['bank of japan decision in march'];
  }
  
  return null;
}

/**
 * 计算价差
 */
function calculateDifferences(ftMarket, polyData) {
  const ftProbs = calculate42spaceProbabilities(ftMarket);
  const polyProbs = polyData?.outcomes || {};
  
  const comparisons = [];
  
  for (const ftKey of Object.keys(ftProbs)) {
    const ftLower = ftKey.toLowerCase();
    let matched = null, diff = 0;
    
    for (const polyKey of Object.keys(polyProbs)) {
      const polyLower = polyKey.toLowerCase();
      
      if (ftLower.includes('no change') && polyLower.includes('no change')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
        break;
      }
      if (ftLower.includes('increase') && polyLower.includes('increase')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
      }
      if (ftLower.includes('decrease') && polyLower.includes('decrease')) {
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
  if (!DISCORD_WEBHOOK || opportunities.length === 0) return;
  
  const embed = {
    embeds: [{
      title: '🚨 42space vs Polymarket 套利机会',
      color: 0x00ff00,
      description: `发现 ${opportunities.length} 个潜在套利机会`,
      fields: opportunities.map(opp => ({
        name: (opp.ftMarket.title || opp.ftMarket.question).slice(0, 100),
        value: opp.comparisons
          .map(c => `• ${c.outcome}: 42space ${c.ftProb}% vs Poly ${c.polyProb}% (差 ${c.diff}%)`)
          .join('\n'),
        inline: false
      })),
      timestamp: new Date().toISOString()
    }]
  };
  
  try {
    const { default: fetch } = await import('node-fetch');
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });
    console.log('Discord notification sent');
  } catch (e) {
    console.error('Discord failed:', e.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 42space vs Polymarket Arbitrage Scanner ===\n');
  
  const ftMarkets = getLatestSnapshot();
  console.log(`Found ${ftMarkets.length} markets\n`);
  
  const liquidMarkets = ftMarkets.filter(m => 
    m.volume?.total > 100 || m.outcomes?.reduce((s, o) => s + (o.volume || 0), 0) > 100
  );
  console.log(`Liquid markets: ${liquidMarkets.length}\n`);
  
  const opportunities = [];
  
  for (const market of liquidMarkets) {
    const title = market.title || market.question;
    console.log(`Checking: ${title}`);
    
    const polyData = matchToPolymarket(market);
    if (!polyData) {
      console.log('  -> No Polymarket match\n');
      continue;
    }
    
    const comparisons = calculateDifferences(market, polyData);
    if (comparisons.length === 0) {
      console.log('  -> No comparable outcomes\n');
      continue;
    }
    
    const maxDiff = comparisons.reduce((max, c) => Math.max(max, parseFloat(c.diff)), 0);
    
    if (maxDiff > ARBITRAGE_THRESHOLD) {
      console.log(`  -> 🚨 ARBITRAGE! Max diff: ${maxDiff}%\n`);
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
  
  console.log(`\n=== Summary ===`);
  console.log(`Opportunities: ${opportunities.length}`);
  
  if (opportunities.length > 0) {
    opportunities.forEach((opp, i) => {
      console.log(`\n${i + 1}. ${opp.ftMarket.title || opp.ftMarket.question}`);
      console.log(`   ${opp.polyUrl}`);
      console.log(`   Max diff: ${opp.maxDiff}%`);
    });
  }
  
  await sendDiscordNotification(opportunities);
  
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
