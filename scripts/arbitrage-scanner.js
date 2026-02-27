/**
 * Arbitrage Scanner: 42space vs Polymarket
 * 
 * 扫描两个平台的相同事件，计算价差，发现套利机会
 * 
 * 运行: node scripts/arbitrage-scanner.js
 */

const fs = require('fs');
const path = require('path');

// 42space GraphQL endpoint
const FT_GRAPHQL = 'https://ft.42.space/v1/graphql';

// Discord webhook (从环境变量或配置文件读取)
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || '';

/**
 * 从 42space GraphQL 获取所有活跃市场
 */
async function fetch42spaceMarkets() {
  const query = `
    query GetMarkets {
      markets(
        limit: 100
        orderBy: { volume: DESC }
      ) {
        id
        question
        conditionId
        slug
        volume
        outcomes {
          id
          tokenId
          symbol
          price
          volume
        }
        timestamps {
          endTimestamp
        }
      }
    }
  `;
  
  const res = await fetch(FT_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const json = await res.json();
  return json.data?.markets || [];
}

/**
 * 计算 42space Pari-mutuel 隐含概率
 * 注意: Pari-mutuel 的概率是基于当前池子比例，而非固定价格
 */
function calculate42spaceProbabilities(market) {
  const totalVolume = market.outcomes.reduce((sum, o) => sum + (o.volume || 0), 0);
  if (totalVolume === 0) return {};
  
  const probs = {};
  market.outcomes.forEach(o => {
    probs[o.symbol] = (o.volume / totalVolume);
  });
  return probs;
}

/**
 * 从 Polymarket API 获取市场数据
 * 使用非官方 API 端点
 */
async function fetchPolymarketEvents(searchTerm) {
  // 尝试通过 API 获取
  const url = `https://clob.polymarket.com/markets?search=${encodeURIComponent(searchTerm)}`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.log('Polymarket API unavailable, using search...');
  }
  
  // Fallback: 返回 null 表示需要通过其他方式获取
  return null;
}

/**
 * 从 Polymarket 获取事件详情
 * 使用事件 slug
 */
async function fetchPolymarketEventBySlug(slug) {
  // 方法1: 尝试 CLOB API
  try {
    const url = `https://clob.polymarket.com/markets?slug=${slug}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) return data[0];
    }
  } catch (e) {}
  
  // 方法2: 从事件页面抓取（需要 browser 或 web_fetch）
  return null;
}

/**
 * 匹配两个平台的事件
 */
function matchEvents(polyMarkets, ftMarket) {
  const ftTitle = ftMarket.question.toLowerCase();
  
  // 简单关键词匹配
  const keywords = ftTitle
    .replace(/[?]/g, '')
    .split(' ')
    .filter(w => w.length > 3);
  
  const matches = [];
  
  for (const poly of polyMarkets || []) {
    const polyTitle = (poly.question || poly.description || '').toLowerCase();
    let score = 0;
    
    for (const kw of keywords) {
      if (polyTitle.includes(kw)) score++;
    }
    
    if (score > 0) {
      matches.push({ market: poly, score });
    }
  }
  
  // 返回得分最高的
  matches.sort((a, b) => b.score - a.score);
  return matches[0]?.market || null;
}

/**
 * 对齐 outcomes 并计算价差
 */
function calculateArbitrage(opportunity) {
  const { ftMarket, polyMarket } = opportunity;
  
  // 获取 42space 概率（基于池子）
  const ftProbs = calculate42spaceProbabilities(ftMarket);
  
  // 从 Polymarket 获取概率（基于价格）
  const polyProbs = {};
  if (polyMarket.outcomes) {
    polyMarket.outcomes.forEach(o => {
      polyProbs[o.title || o.outcome] = parseFloat(o.price || 0);
    });
  }
  
  // 对齐 outcomes
  const comparisons = [];
  const ftKeys = Object.keys(ftProbs);
  const polyKeys = Object.keys(polyProbs);
  
  for (const ftKey of ftKeys) {
    // 尝试匹配 poly outcome
    let matched = null;
    let diff = 0;
    
    for (const polyKey of polyKeys) {
      if (ftKey.toLowerCase().includes('no change') && polyKey.toLowerCase().includes('no change')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
        break;
      }
      if (ftKey.toLowerCase().includes('increase') && polyKey.toLowerCase().includes('increase')) {
        matched = polyKey;
        diff = Math.abs(ftProbs[ftKey] - polyProbs[polyKey]);
      }
      if (ftKey.toLowerCase().includes('decrease') && polyKey.toLowerCase().includes('decrease')) {
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
      fields: opportunities.map(opp => ({
        name: opp.ftMarket.question,
        value: opp.comparisons
          .map(c => `• ${c.outcome}: 42space ${c.ftProb}% vs Poly ${c.polyProb}% (差 ${c.diff}%)`)
          .join('\n'),
        inline: false
      })),
      timestamp: new Date().toISOString()
    }]
  };
  
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(embed)
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 42space vs Polymarket Arbitrage Scanner ===\n');
  
  // 1. 获取 42space 市场
  console.log('Fetching 42space markets...');
  const ftMarkets = await fetch42spaceMarkets();
  console.log(`Found ${ftMarkets.length} 42space markets\n`);
  
  // 2. 筛选高流动性市场（> $1000）
  const liquidMarkets = ftMarkets.filter(m => (m.volume || 0) > 1000);
  console.log(`Liquid markets (> $1000): ${liquidMarkets.length}\n`);
  
  // 3. 扫描每个市场
  const opportunities = [];
  
  for (const market of liquidMarkets.slice(0, 20)) {
    console.log(`Checking: ${market.question}`);
    
    // 搜索 Polymarket
    const searchTerm = market.question.replace(/[?]/g, '').split(' ').slice(0, 3).join(' ');
    const polyMarkets = await fetchPolymarketEvents(searchTerm);
    
    if (!polyMarkets || polyMarkets.length === 0) {
      console.log('  -> No Polymarket match found\n');
      continue;
    }
    
    // 匹配事件
    const matchedPoly = matchEvents(polyMarkets, market);
    if (!matchedPoly) {
      console.log('  -> No close match\n');
      continue;
    }
    
    // 计算价差
    const comparisons = calculateArbitrage({ ftMarket: market, polyMarket: matchedPoly });
    
    // 检查是否有显著差异 (>10%)
    const maxDiff = comparisons.reduce((max, c) => Math.max(max, parseFloat(c.diff)), 0);
    
    if (maxDiff > 10) {
      console.log(`  -> 🚨 ARBITRAGE OPPORTUNITY! Max diff: ${maxDiff}%\n`);
      opportunities.push({
        ftMarket: market,
        polyMarket: matchedPoly,
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
      console.log(`\n${i + 1}. ${opp.ftMarket.question}`);
      console.log(`   Max diff: ${opp.maxDiff}%`);
    });
    
    // 5. 发送通知
    await sendDiscordNotification(opportunities);
  }
  
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
