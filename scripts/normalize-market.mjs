/**
 * normalize-market.mjs - 将42.space 原始 数据映射为 normalized market schema
 * 
 * 功能：
 * - 调用 fetch-markets.mjs 获取原始数据
 * - 转换为统一的 normalized market schema
 * - 输出到 outputs/markets-normalized-YYYY-MM-DD.json
 * 
 * 使用方式：
 *   node scripts/normalize-market.mjs [--limit N] [--offset N]
 * 
 * Normalized Schema:
 * {
 *   platform: "42space",
 *   market_id: string,        // question_id (唯一标识)
 *   condition_id: string,    // 同 question_id (用于兼容)
 *   title: string,           // 市场标题/问题
 *   question: string,        // 同 title
 *   description: string,    // 详细描述
 *   outcomes: [
 *     {
 *       id: string,
 *       token_id: number,
 *       symbol: string,      // 显示名称
 *       description: string,
 *       price: number|null,  // 当前价格 (0-1)
 *       volume: number|null, // 成交量
 *       traders: number|null // 交易者数量
 *     }
 *   ],
 *   prices: object|null,     // { tokenId: price } 简写
 *   fees: object|null,       // 费用信息
 *   timestamps: {
 *     created_at: string,    // 创建时间 (ISO)
 *     end_timestamp: string|null, // 结束时间
 *     resolved_at: string|null,   // 结算时间
 *     updated_at: string|null     // 更新时间
 *   },
 *   resolution: {
 *     status: string,        // live, finalised, closed 等
 *     source: string|null,   // 结算来源
 *     result: string|null    // 结算结果
 *   },
 *   volume: {
 *     total: number,         // 总成交量 (USD)
 *     buy: number,           // 买入成交量
 *     sell: number           // 卖出成交量
 *   },
 *   traders: number|null,    // 交易者数量
 *   collateral: number|null, // 抵押金额
 *   category: string|null,   // 分类
 *   raw: object              // 原始数据 (保留)
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ 配置 ============
const PRICE_DECIMALS = 18;     // 价格精度
const VOLUME_DECIMALS = 18;    // 成交量精度

// ============ 工具函数 ============

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    limit: 50,
    offset: 0,
    fetchRaw: true,    // 是否重新抓取原始数据
    input: null,       // 输入文件 (已有数据)
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--limit' && i + 1 < args.length) {
      config.limit = parseInt(args[++i], 10);
    } else if (arg === '--offset' && i + 1 < args.length) {
      config.offset = parseInt(args[++i], 10);
    } else if (arg === '--input' && i + 1 < args.length) {
      config.input = args[++i];
      config.fetchRaw = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
normalize-market.mjs - 将 42.space 数据标准化

用法: node normalize-market.mjs [选项]

选项:
  --limit N       抓取的市场数量 (默认: 50)
  --offset N      偏移量 (默认: 0)
  --input FILE    使用已有 JSON 文件 (跳过抓取)
  --help, -h      显示帮助信息

示例:
  node normalize-market.mjs --limit 100
  node normalize-market.mjs --input ../data/markets-raw.json
  `);
}

/**
 * 将高精度数值转换为普通数字
 */
function parseBigInt(value, decimals = 0) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  
  try {
    const bigIntVal = BigInt(value);
    if (decimals === 0) return Number(bigIntVal);
    return Number(bigIntVal) / Math.pow(10, decimals);
  } catch (e) {
    return null;
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  return new Date(ts).toISOString();
}

// ============ Normalization 函数 ============

/**
 * 标准化单个市场数据
 */
function normalizeMarket(raw, stats = null, outcomeDetails = null) {
  const {
    question_id,
    title,
    description,
    created_at,
    current_end_timestamp,
    status,
    resolved_at,
    resolution_source,
    question_categories,
    outcomes,
  } = raw;

  // 解析 outcomes
  const normalizedOutcomes = [];
  const prices = {};
  const outcomeMap = new Map();
  
  // 先建立 token_id 到 outcome 元数据的映射
  if (outcomeDetails?.outcome_metadata) {
    for (const meta of outcomeDetails.outcome_metadata) {
      outcomeMap.set(String(meta.token_id), meta);
    }
  }

  // 解析 current_outcome_stats
  let outcomeStatsMap = new Map();
  if (outcomeDetails?.current_outcome_stats) {
    for (const stat of outcomeDetails.current_outcome_stats) {
      outcomeStatsMap.set(String(stat.token_id), stat);
    }
  }

  // 构建 outcomes 数组
  if (outcomes && outcomes.length > 0) {
    for (const outcome of outcomes) {
      const tokenId = String(outcome.token_id);
      const meta = outcomeMap.get(tokenId);
      const stat = outcomeStatsMap.get(tokenId);
      
      // 解析价格
      let price = null;
      if (stat?.marginal_price) {
        price = parseBigInt(stat.marginal_price, PRICE_DECIMALS);
      }
      
      if (price !== null) {
        prices[tokenId] = price;
      }
      
      normalizedOutcomes.push({
        id: outcome.id,
        token_id: parseInt(tokenId, 10),
        symbol: meta?.symbol || `Outcome ${tokenId}`,
        description: meta?.description || null,
        price,
        volume: stat ? parseBigInt(stat.total_volume, VOLUME_DECIMALS) : null,
        traders: stat?.traders || null,
      });
    }
  }

  // 解析市场统计
  let volume = { total: 0, buy: 0, sell: 0 };
  let traders = null;
  let collateral = null;
  
  if (stats) {
    volume = {
      total: parseBigInt(stats.total_volume, VOLUME_DECIMALS) || 0,
      buy: parseBigInt(stats.buy_volume, VOLUME_DECIMALS) || 0,
      sell: parseBigInt(stats.sell_volume, VOLUME_DECIMALS) || 0,
    };
    traders = stats.traders;
    collateral = parseBigInt(stats.collateral, VOLUME_DECIMALS);
  }

  // 分类
  let category = null;
  if (question_categories && question_categories.length > 0) {
    category = question_categories[0]?.category?.name || null;
  }

  return {
    platform: '42space',
    market_id: question_id,
    condition_id: question_id,  // 兼容其他平台
    title: title || null,
    question: title || null,
    description: description || null,
    outcomes: normalizedOutcomes,
    prices: Object.keys(prices).length > 0 ? prices : null,
    fees: null,  // 42.space 暂未提供费用数据
    timestamps: {
      created_at: formatTimestamp(created_at),
      end_timestamp: formatTimestamp(current_end_timestamp),
      resolved_at: formatTimestamp(resolved_at),
      updated_at: stats?.updated_at ? formatTimestamp(stats.updated_at) : null,
    },
    resolution: {
      status: status || null,
      source: resolution_source || null,
      result: null,  // 需要额外查询
    },
    volume,
    traders,
    collateral,
    category,
    raw,  // 保留原始数据
  };
}

// ============ 主函数 ============

async function main() {
  const config = parseArgs();
  
  // 获取日期用于输出文件名
  const today = new Date().toISOString().split('T')[0];
  const outputDir = path.resolve(__dirname, '..', 'knowledge', 'outputs');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let rawMarkets;
  
  if (config.input) {
    // 从文件读取
    console.error(`[INFO] 从文件读取: ${config.input}`);
    const inputPath = path.resolve(__dirname, '..', config.input);
    const content = fs.readFileSync(inputPath, 'utf-8');
    rawMarkets = JSON.parse(content);
  } else {
    // 调用 fetch-markets.mjs 抓取数据
    console.error(`[INFO] 抓取原始数据: limit=${config.limit}, offset=${config.offset}`);
    
    // 动态导入 fetch-markets.mjs
    const { fetchMarkets } = await import('./fetch-markets.mjs');
    rawMarkets = await fetchMarkets({
      limit: config.limit,
      offset: config.offset,
    });
    
    console.error(`[INFO] 获取到 ${rawMarkets.length} 条原始数据`);
  }

  if (!rawMarkets || rawMarkets.length === 0) {
    console.error('[WARN] 没有数据可处理');
    return;
  }

  // 获取每个市场的详细信息（包含 outcomes 和价格）
  console.error(`[INFO] 正在获取市场详情和统计...`);
  
  // 动态导入
  const { fetchMarketDetail, fetchMarketStats } = await import('./fetch-markets.mjs');
  
  const normalizedMarkets = [];
  
  for (let i = 0; i < rawMarkets.length; i++) {
    const market = rawMarkets[i];
    const questionId = market.question_id;
    
    console.error(`[INFO] 处理 ${i + 1}/${rawMarkets.length}: ${questionId.substring(0, 16)}...`);
    
    try {
      // 获取详情（包含 outcomes 和 prices）
      const details = await fetchMarketDetail(questionId);
      
      // 获取市场统计
      const stats = await fetchMarketStats([questionId]);
      
      // 标准化
      const normalized = normalizeMarket(
        { ...market, ...details.question_by_pk },  // 合并基础信息和详情
        stats?.[0] || null,
        details
      );
      
      normalizedMarkets.push(normalized);
      
      // 限速
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`[WARN] 处理市场失败 ${questionId}: ${error.message}`);
      // 即使失败也添加基本信息
      normalizedMarkets.push(normalizeMarket(market, null, null));
    }
  }

  // 输出结果
  const outputFile = path.join(outputDir, `markets-normalized-${today}.json`);
  const output = JSON.stringify(normalizedMarkets, null, 2);
  
  fs.writeFileSync(outputFile, output, 'utf-8');
  
  console.error(`[SUCCESS] 已保存到: ${outputFile}`);
  console.error(`[INFO] 共处理 ${normalizedMarkets.length} 个市场`);
  
  // 打印摘要
  const liveCount = normalizedMarkets.filter(m => m.resolution.status === 'live').length;
  const finalizedCount = normalizedMarkets.filter(m => m.resolution.status === 'finalised').length;
  
  console.error(`[SUMMARY] Live: ${liveCount}, Finalized: ${finalizedCount}, Total: ${normalizedMarkets.length}`);
}

// 导出函数
export {
  normalizeMarket,
  parseBigInt,
  formatTimestamp,
};

// 如果直接运行
if (process.argv[1] && process.argv[1].endsWith('normalize-market.mjs')) {
  main().catch(console.error);
}
