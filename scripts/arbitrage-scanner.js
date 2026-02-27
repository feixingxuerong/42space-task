/**
 * Arbitrage Scanner: 42space vs Polymarket
 * 
 * ⚠️ 重要说明：
 * 42space 使用 Pari-mutuel 机制，API 返回的 price 不是概率
 * 页面显示的 "implied payout" 才是真实概率 (probability = 1 / payout)
 * 
 * 例如：
 * - implied payout 1.2x → 概率 = 1/1.2 = 83.3%
 * - implied payout 29.5x → 概率 = 1/29.5 = 3.4%
 * 
 * 由于 API 不返回 implied payout，我们用两种方式估算：
 * 1. volume 池子比例 (pari-mutuel 本质)
 * 2. price 归一化 (近似订单簿)
 * 
 * 运行: node scripts/arbitrage-scanner.js
 */

const fs = require('fs');
const path = require('path');

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
 * 计算 42space 概率（两种方法）
 */
function calculate42spaceProbabilities(market) {
  if (!market.outcomes) return {};
  
  const results = {
    volumeBased: {},
    priceBased: {}
  };
  
  // 方法1: volume 池子比例
  const totalVolume = market.outcomes.reduce((sum, o) => sum + (o.volume || 0), 0);
  if (totalVolume > 0) {
    market.outcomes.forEach(o => {
      results.volumeBased[o.symbol] = o.volume / totalVolume;
    });
  }
  
  // 方法2: price 归一化
  const prices = market.outcomes.map(o => o.price);
  const sumPrices = prices.reduce((a, b) => a + b, 0);
  if (sumPrices > 0) {
    market.outcomes.forEach(o => {
      results.priceBased[o.symbol] = o.price / sumPrices;
    });
  }
  
  return results;
}

/**
 * 已知 Polymarket 事件
 * Polymarket 价格 = 概率 (Yes 价格)
 */
const KNOWN_POLYMARKET_EVENTS = {
  'bank of japan decision in march': {
    url: 'https://polymarket.com/event/bank-of-japan-decision-in-march',
    // 从页面抓取的实际概率
    outcomes: {
      'no change': 0.948,      // 94.8% (页面显示)
      '25 bps increase': 0.04, // 4%
      'decrease rates': 0.005,
      '50+ bps increase': 0.005
    },
    // 42space 页面的 implied payout (从页面抓取)
    ftImpliedPayouts: {
      'no change': 1.2,    // 1.2x → 83.3%
      '25 bps decrease': 1.2, // 1.2x → 83.3%
      '25+ bps increase': 29.5, // 29.5x → 3.4%
      '50+ bps decrease': 29.5
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
  
  for (const key of Object.keys(KNOWN_POLYMARKET_EVENTS)) {
    if (title.includes(key) || key.includes(title)) {
      return KNOWN_POLYMARKET_EVENTS[key];
    }
  }
  
  if (title.includes('bank of japan') || title.includes('boj')) {
    return KNOWN_POLYMARKET_EVENTS['bank of japan decision in march'];
  }
  
  return null;
}

/**
 * 计算价差（使用 implied payout）
 */
function calculateDifferencesWithImpliedPayout(ftMarket, polyData) {
  const comparisons = [];
  
  // 使用 42space 页面抓取的 implied payouts
  const ftImplied = polyData.ftImpliedPayouts || {};
  const polyProbs = polyData.outcomes || {};
  
  for (const [outcome, payout] of Object.entries(ftImplied)) {
    // 42space: probability = 1 / payout
    const ftProb = 1 / payout;
    
    // 匹配 Polymarket outcome
    let matchedPoly = null;
    let polyProb = 0;
    
    const outcomeLower = outcome.toLowerCase();
    
    for (const [polyKey, polyP] of Object.entries(polyProbs)) {
      const polyKeyLower = polyKey.toLowerCase();
      
      if (outcomeLower.includes('no change') && polyKeyLower.includes('no change')) {
        matchedPoly = polyKey;
        polyProb = polyP;
        break;
      }
      if (outcomeLower.includes('increase') && polyKeyLower.includes('increase')) {
        matchedPoly = polyKey;
        polyProb = polyP;
      }
      if (outcomeLower.includes('decrease') && polyKeyLower.includes('decrease')) {
        matchedPoly = polyKey;
        polyProb = polyP;
      }
    }
    
    if (matchedPoly) {
      const diff = Math.abs(ftProb - polyProb);
      comparisons.push({
        outcome,
        ftProb: (ftProb * 100).toFixed(1),
        ftPayout: payout + 'x',
        polyProb: (polyProb * 100).toFixed(1),
        diff: (diff * 100).toFixed(1)
      });
    }
  }
  
  return comparisons;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 42space vs Polymarket Arbitrage Scanner ===\n');
  console.log('使用 implied payout 计算 42space 概率\n');
  console.log('公式: probability = 1 / implied_payout\n');
  
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
    
    // 使用 implied payout 计算
    const comparisons = calculateDifferencesWithImpliedPayout(market, polyData);
    
    if (comparisons.length === 0) {
      console.log('  -> No comparable outcomes\n');
      continue;
    }
    
    console.log('  Comparisons:');
    comparisons.forEach(c => {
      console.log(`    ${c.outcome}: 42space ${c.ftProb}% (${c.ftPayout}) vs Poly ${c.polyProb}% (差 ${c.diff}%)`);
    });
    
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
