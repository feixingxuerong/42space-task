/**
 * 生成每日 markets normalized snapshot
 * 输出: outputs/markets-normalized-YYYY-MM-DD.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GRAPHQL_ENDPOINT = 'ft.42.space';
const GRAPHQL_PATH = '/v1/graphql';
const OUTPUT_DIR = path.join(__dirname, '..', 'knowledge', 'outputs');

// 获取当天日期 (UTC)
function getDateString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GraphQL 请求
function graphqlRequest(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const options = {
      hostname: GRAPHQL_ENDPOINT,
      port: 443,
      path: GRAPHQL_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Origin': 'https://www.42.space',
        'Referer': 'https://www.42.space/'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 获取市场列表 (使用 introspection 或已知查询)
async function getMarkets() {
  const query = `query {
    question(
      where: {active: {_eq: true}}
      limit: 100
      order_by: {created_at: desc}
    ) {
      question_id
      title
      description
      created_at
      active
      question_categories {
        category_id
        category {
          name
        }
      }
      outcomes {
        id
        token_id
      }
    }
  }`;
  
  const response = await graphqlRequest(query);
  return response.data?.question || [];
}

// 获取市场统计
async function getMarketStats(marketAddresses) {
  if (!marketAddresses || marketAddresses.length === 0) return {};
  
  const query = `query {
    current_market_stats(
      where: {market_address: {_in: [${marketAddresses.map(a => `"${a}"`).join(',')}]}}
    ) {
      market_address
      total_volume
      buy_volume
      sell_volume
      traders
      collateral
    }
  }`;
  
  const response = await graphqlRequest(query);
  const stats = {};
  for (const stat of response.data?.current_market_stats || []) {
    stats[stat.market_address] = stat;
  }
  return stats;
}

// 获取 outcome stats
async function getOutcomeStats(questionIds) {
  if (!questionIds || questionIds.length === 0) return {};
  
  const query = `query {
    current_outcome_stats(
      where: {question_id: {_in: [${questionIds.map(q => `"${q}"`).join(',')}]}}}
      limit: 500
    ) {
      question_id
      token_id
      market_address
      marginal_price
      collateral
      total_volume
      buy_volume
      sell_volume
      traders
      updated_at
    }
  }`;
  
  const response = await graphqlRequest(query);
  const stats = {};
  for (const stat of response.data?.current_outcome_stats || []) {
    if (!stats[stat.question_id]) {
      stats[stat.question_id] = [];
    }
    stats[stat.question_id].push(stat);
  }
  return stats;
}

// 主函数
async function main() {
  console.log('Fetching markets data...');
  
  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // 获取市场数据
  const markets = await getMarkets();
  console.log(`Found ${markets.length} active markets`);
  
  // 提取 market addresses 和 question ids
  const marketAddresses = markets
    .map(m => m.outcomes?.[0]?.id)
    .filter(Boolean);
  const questionIds = markets.map(m => m.question_id).filter(Boolean);
  
  // 并行获取统计数据
  const [marketStats, outcomeStats] = await Promise.all([
    getMarketStats(marketAddresses),
    getOutcomeStats(questionIds)
  ]);
  
  // 构建 normalized 输出
  const dateStr = getDateString();
  const normalized = {
    generated_at: new Date().toISOString(),
    date: dateStr,
    source: '42.space GraphQL',
    markets: markets.map(market => {
      const marketAddr = market.outcomes?.[0]?.id || '';
      const stats = marketStats[marketAddr] || {};
      const outcomes = outcomeStats[market.question_id] || [];
      
      return {
        question_id: market.question_id,
        title: market.title,
        description: market.description,
        created_at: market.created_at,
        active: market.active,
        categories: market.question_categories?.map(c => c.category?.name).filter(Boolean) || [],
        outcomes: market.outcomes?.map(o => ({
          token_id: o.token_id,
          outcome_id: o.id
        })) || [],
        stats: {
          total_volume: stats.total_volume || '0',
          buy_volume: stats.buy_volume || '0',
          sell_volume: stats.sell_volume || '0',
          traders: stats.traders || 0,
          collateral: stats.collateral || '0'
        },
        outcome_prices: outcomes.map(o => ({
          token_id: o.token_id,
          marginal_price: o.marginal_price,
          volume: o.total_volume || '0',
          traders: o.traders || 0
        }))
      };
    }),
    summary: {
      total_markets: markets.length,
      active_markets: markets.filter(m => m.active).length
    }
  };
  
  // 写入文件
  const outputFile = path.join(OUTPUT_DIR, `markets-normalized-${dateStr}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(normalized, null, 2));
  console.log(`Written to: ${outputFile}`);
  
  // 同时更新 latest.json 方便引用
  const latestFile = path.join(OUTPUT_DIR, 'markets-normalized-latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(normalized, null, 2));
  console.log(`Written to: ${latestFile}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
