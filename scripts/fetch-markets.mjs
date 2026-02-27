/**
 * fetch-markets.mjs - 从 42.space Hasura API 抓取市场数据
 * 
 * 功能：
 * - 调用 GraphQL API 抓取 markets/questions/outcomes
 * - 分页处理（支持 offset 方式）
 * - 限速（避免被封）
 * - 自动重试（网络错误时）
 * 
 * 使用方式：
 *   node scripts/fetch-markets.mjs [--limit N] [--offset N] [--output FILE]
 * 
 * 示例：
 *   node scripts/fetch-markets.mjs --limit 50 --offset 0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ 配置 ============
const GRAPHQL_ENDPOINT = 'https://ft.42.space/v1/graphql';
const DEFAULT_LIMIT = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;  // 2秒
const REQUEST_DELAY_MS = 500; // 请求间隔 500ms

// ============ 工具函数 ============

/**
 * 发送 GraphQL 请求（带重试）
 */
async function graphqlRequest(query, variables = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE',  // 只读接口通常不需要认证
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`请求失败 (尝试 ${attempt + 1}/${retries + 1}): ${error.message}`);
        await sleep(RETRY_DELAY_MS * (attempt + 1)); // 指数退避
      } else {
        throw error;
      }
    }
  }
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    limit: DEFAULT_LIMIT,
    offset: 0,
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--limit' && i + 1 < args.length) {
      config.limit = parseInt(args[++i], 10);
    } else if (arg === '--offset' && i + 1 < args.length) {
      config.offset = parseInt(args[++i], 10);
    } else if (arg === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
fetch-markets.mjs - 从 42.space 抓取市场数据

用法: node fetch-markets.mjs [选项]

选项:
  --limit N      每次请求的数量 (默认: ${DEFAULT_LIMIT})
  --offset N     偏移量 (默认: 0)
  --output FILE  输出文件路径 (默认: 输出到 stdout)
  --help, -h     显示帮助信息

示例:
  node fetch-markets.mjs --limit 50 --offset 0
  node fetch-markets.mjs --limit 100 > markets.json
  `);
}

// ============ GraphQL 查询 ============

/**
 * 获取市场列表（带分页）
 */
const LIST_MARKETS_QUERY = `
  query ListMarkets($limit: Int!, $offset: Int!) {
    home_market_list(
      limit: $limit
      offset: $offset
    ) {
      question_id
      title
    }
  }
`;

/**
 * 获取市场统计
 */
const MARKET_STATS_QUERY = `
  query MarketStats($questionIds: [String!]!) {
    current_market_stats(
      where: { question_id: { _in: $questionIds } }
    ) {
      question_id
      market_address
      total_volume
      buy_volume
      sell_volume
      traders
      collateral
      updated_at
    }
  }
`;

/**
 * 获取单个市场详情
 */
const MARKET_DETAIL_QUERY = `
  query MarketDetail($questionId: String!) {
    question_by_pk(question_id: $questionId) {
      question_id
      title
      description
      created_at
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
    outcome_metadata(where: { question_id: { _eq: $questionId } }) {
      id
      question_id
      token_id
      symbol
      description
    }
    current_outcome_stats(where: { question_id: { _eq: $questionId } }) {
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
  }
`;

/**
 * 获取问题状态列表
 */
const QUESTION_STATUS_QUERY = `
  query QuestionStatus($limit: Int!, $offset: Int!) {
    question_status(
      limit: $limit
      offset: $offset
    ) {
      question_id
      title
      status
      current_end_timestamp
    }
  }
`;

// ============ 主函数 ============

/**
 * 抓取市场列表（带分页）
 */
async function fetchMarkets(config) {
  console.error(`[INFO] 抓取市场列表: limit=${config.limit}, offset=${config.offset}`);
  
  const data = await graphqlRequest(LIST_MARKETS_QUERY, {
    limit: config.limit,
    offset: config.offset,
  });

  const markets = data?.home_market_list || [];
  console.error(`[INFO] 获取到 ${markets.length} 个市场`);
  
  return markets;
}

/**
 * 抓取所有市场（自动分页）
 */
async function fetchAllMarkets(maxTotal = 200, pageSize = 50) {
  const allMarkets = [];
  let offset = 0;
  
  while (allMarkets.length < maxTotal) {
    console.error(`[INFO] 抓取第 ${offset / pageSize + 1} 页 (offset=${offset})...`);
    
    const markets = await fetchMarkets({ limit: pageSize, offset });
    
    if (!markets || markets.length === 0) {
      break;
    }
    
    allMarkets.push(...markets);
    
    // 限速
    await sleep(REQUEST_DELAY_MS);
    
    if (markets.length < pageSize) {
      break; // 没有更多数据
    }
    
    offset += pageSize;
  }
  
  console.error(`[INFO] 共获取 ${allMarkets.length} 个市场`);
  return allMarkets;
}

/**
 * 抓取单个市场的详细信息
 */
async function fetchMarketDetail(questionId) {
  console.error(`[INFO] 抓取市场详情: ${questionId}`);
  
  const data = await graphqlRequest(MARKET_DETAIL_QUERY, {
    questionId,
  });

  return data;
}

/**
 * 批量抓取市场统计
 */
async function fetchMarketStats(questionIds) {
  if (!questionIds || questionIds.length === 0) return [];
  
  console.error(`[INFO] 批量抓取 ${questionIds.length} 个市场的统计...`);
  
  const data = await graphqlRequest(MARKET_STATS_QUERY, {
    questionIds,
  });

  return data?.current_market_stats || [];
}

// ============ 导出/入口 ============

async function main() {
  const config = parseArgs();
  
  try {
    let result;
    
    if (config.limit <= 50) {
      // 小批量抓取 - 一次性获取
      result = await fetchMarkets(config);
    } else {
      // 大批量 - 自动分页
      result = await fetchAllMarkets(config.limit + config.offset, config.limit);
    }

    // 输出结果
    const output = JSON.stringify(result, null, 2);
    
    if (config.output) {
      const outputPath = path.resolve(__dirname, '..', config.output);
      fs.writeFileSync(outputPath, output, 'utf-8');
      console.error(`[INFO] 已保存到: ${outputPath}`);
    } else {
      console.log(output);
    }
    
    console.error(`[SUCCESS] 完成! 获取 ${result.length} 条记录`);
    
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  }
}

// 导出函数供 normalize-market.mjs 调用
export {
  fetchMarkets,
  fetchAllMarkets,
  fetchMarketDetail,
  fetchMarketStats,
  graphqlRequest,
  GRAPHQL_ENDPOINT,
};

// 如果直接运行
if (process.argv[1] && process.argv[1].endsWith('fetch-markets.mjs')) {
  main();
}
