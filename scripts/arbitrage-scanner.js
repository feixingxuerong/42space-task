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
 * 
 * 更新日期: 2026-02-27
 * 数据来源: 通过浏览器抓取 Polymarket 页面
 */
const KNOWN_POLYMARKET_EVENTS = {
  // Fed 决策 - 2026年3月
  // URL: https://polymarket.com/event/fed-decision-in-march-885
  'fed decision in march 2026': {
    url: 'https://polymarket.com/event/fed-decision-in-march-885',
    outcomes: {
      'no change': 0.97,          // 97%
      '25 bps decrease': 0.02,    // 2%
      '50+ bps decrease': 0.01,   // 1%
      '25+ bps increase': 0.001    // <1%
    }
  },
  
  // Bank of Japan 决策 - 2026年3月
  // URL: https://polymarket.com/event/bank-of-japan-decision-in-march
  'bank of japan decision in march': {
    url: 'https://polymarket.com/event/bank-of-japan-decision-in-march',
    outcomes: {
      'no change': 0.95,          // 95%
      '25 bps increase': 0.04,    // 4%
      'decrease rates': 0.01,     // 1%
      '50+ bps increase': 0.01     // 1%
    },
    // 42space 页面的 implied payout (从 normalized snapshot volume 推算)
    // 42space 使用 pari-mutuel, probability ≈ volume / totalVolume
    ftVolumeBased: {
      'no change': 0.407,         // 261.86 / 643.36
      '25 bps decrease': 0.414,    // 266.22 / 643.36
      '25+ bps increase': 0.163,   // 105.10 / 643.36
      '50+ bps decrease': 0.016   // 10.18 / 643.36
    }
  },
  
  // Bank of Japan 决策 - 2026年4月
  // URL: https://polymarket.com/event/bank-of-japan-decision-in-april
  'bank of japan decision in april': {
    url: 'https://polymarket.com/event/bank-of-japan-decision-in-april',
    outcomes: {
      'no change': 0.51,          // 51%
      '25 bps increase': 0.45,     // 45%
      'decrease rates': 0.01,      // 1%
      '50+ bps increase': 0.01     // 1%
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
 * 计算价差（使用 volume-based 概率）
 * 42space 使用 pari-mutuel, probability ≈ volume / totalVolume
 */
function calculateDifferencesWithVolume(ftMarket, polyData) {
  const comparisons = [];
  
  // 计算 42space volume-based 概率
  const ftProbs = calculate42spaceProbabilities(ftMarket);
  const ftVolumeProbs = ftProbs.volumeBased;
  const polyProbs = polyData.outcomes || {};
  
  // 匹配 outcomes
  for (const [ftOutcome, ftProb] of Object.entries(ftVolumeProbs)) {
    // 匹配 Polymarket outcome
    let matchedPoly = null;
    let polyProb = 0;
    
    const ftOutcomeLower = ftOutcome.toLowerCase();
    
    for (const [polyKey, polyP] of Object.entries(polyProbs)) {
      const polyKeyLower = polyKey.toLowerCase();
      
      // 尝试多种匹配方式
      if (ftOutcomeLower === polyKeyLower) {
        matchedPoly = polyKey;
        polyProb = polyP;
        break;
      }
      if (ftOutcomeLower.includes('no change') && polyKeyLower.includes('no change')) {
        matchedPoly = polyKey;
        polyProb = polyP;
        break;
      }
      if (ftOutcomeLower.includes('decrease') && polyKeyLower.includes('decrease')) {
        matchedPoly = polyKey;
        polyProb = polyP;
        break;
      }
      if (ftOutcomeLower.includes('increase') && polyKeyLower.includes('increase')) {
        matchedPoly = polyKey;
        polyProb = polyP;
      }
    }
    
    if (matchedPoly && polyProb > 0) {
      const diff = Math.abs(ftProb - polyProb);
      comparisons.push({
        outcome: ftOutcome,
        ftProb: (ftProb * 100).toFixed(1) + '%',
        polyProb: (polyProb * 100).toFixed(1) + '%',
        diff: (diff * 100).toFixed(1) + '%',
        diffValue: diff
      });
    }
  }
  
  return comparisons;
}

/**
 * 计算价差（使用 implied payout - 旧方法，保留兼容）
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
  console.log('使用 volume-based 概率计算 42space 概率\n');
  console.log('公式: probability = volume / totalVolume (pari-mutuel)\n');
  
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
    
    // 使用 volume-based 概率计算
    const comparisons = calculateDifferencesWithVolume(market, polyData);
    
    if (comparisons.length === 0) {
      console.log('  -> No comparable outcomes\n');
      continue;
    }
    
    console.log('  Comparisons:');
    comparisons.forEach(c => {
      console.log(`    ${c.outcome}: 42space ${c.ftProb} vs Poly ${c.polyProb} (差 ${c.diff})`);
    });
    
    const maxDiff = comparisons.reduce((max, c) => Math.max(max, c.diffValue || 0), 0);
    const maxDiffPercent = (maxDiff * 100).toFixed(1);
    
    if (maxDiffPercent > ARBITRAGE_THRESHOLD) {
      console.log(`  -> 🚨 ARBITRAGE! Max diff: ${maxDiffPercent}%\n`);
      opportunities.push({
        ftMarket: market,
        polyUrl: polyData.url,
        comparisons,
        maxDiff: maxDiffPercent
      });
    } else {
      console.log(`  -> Diff: ${maxDiffPercent}%\n`);
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
