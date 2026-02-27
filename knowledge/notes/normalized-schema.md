# Normalized Market Schema

> 用于统一不同预测市场平台的数据格式，便于聚合分析和交易策略开发。

## 概述

本 schema 用于将 42.space (以及后续其他平台) 的市场数据转换为统一格式。

## 完整 Schema

```typescript
interface NormalizedMarket {
  // 平台标识
  platform: string;           // e.g., "42space", "polymarket", "manifold"
  
  // 市场标识
  market_id: string;          // 平台原生的市场唯一ID
  condition_id: string;       // 兼容其他平台的 condition_id 概念
  
  // 标题/问题
  title: string;              // 市场标题
  question: string;           // 同 title，便于兼容
  description: string|null;   // 详细描述/规则说明
  
  // 结果选项
  outcomes: NormalizedOutcome[];
  
  // 价格快照 (简写形式)
  prices: Record<string, number>|null;  // { tokenId: price }
  
  // 费用信息
  fees: {
    trading_fee?: number;     // 交易手续费 (0-1)
    withdrawal_fee?: number;  // 提现费用
    other_fees?: string;
  }|null;
  
  // 时间戳
  timestamps: {
    created_at: string|null;    // 创建时间 (ISO 8601)
    end_timestamp: string|null; // 结束/到期时间
    resolved_at: string|null;   // 结算时间
    updated_at: string|null;     // 最后更新时间
  };
  
  // 结算信息
  resolution: {
    status: string;           // live, finalised, closed, pending
    source: string|null;      // 结算数据来源
    result: string|null;      // 结算结果描述
  };
  
  // 成交量
  volume: {
    total: number;            // 总成交量 (USD 近似值)
    buy: number;              // 买入成交量
    sell: number;             // 卖出成交量
  };
  
  // 参与者
  traders: number|null;       // 交易者数量
  
  // 抵押金额
  collateral: number|null;   // 抵押总金额
  
  // 分类
  category: string|null;     // 市场分类
  
  // 原始数据 (保留)
  raw: object;
}

interface NormalizedOutcome {
  id: string;
  token_id: number;          // token ID (2^n)
  symbol: string;            // 显示名称
  description: string|null;  // 详细描述
  
  // 当前状态
  price: number|null;        // 当前价格/概率 (0-1)
  volume: number|null;       // 该 outcome 的成交量
  traders: number|null;      // 交易者数量
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `platform` | string | 是 | 平台名称 (小写) |
| `market_id` | string | 是 | 市场唯一ID |
| `condition_id` | string | 是 | 用于跨平台匹配 |
| `title` | string | 是 | 市场问题/标题 |
| `outcomes` | array | 是 | 结果选项列表 |
| `prices` | object/null | 否 | 价格快照 |
| `resolution.status` | string | 是 | 市场状态 |
| `volume.total` | number | 否 | 总成交量 |
| `timestamps` | object | 是 | 时间相关字段 |

## 状态值

- `live`: 交易中
- `finalised`: 已结算
- `closed`: 已关闭
- `pending`: 待结算

## 使用场景

1. **数据聚合**: 将多个平台的数据统一存储
2. **策略回测**: 统一格式便于编写跨平台策略
3. **监控告警**: 统一监控各平台的市场状态

## 42.space 字段映射

| 原始字段 | Normalized 字段 |
|----------|-----------------|
| `question_id` | `market_id`, `condition_id` |
| `title` | `title`, `question` |
| `description` | `description` |
| `outcomes` | `outcomes` |
| `outcome_metadata` | `outcomes[].symbol`, `outcomes[].description` |
| `current_outcome_stats.marginal_price` | `outcomes[].price` |
| `current_outcome_stats.total_volume` | `outcomes[].volume` |
| `current_market_stats.total_volume` | `volume.total` |
| `status` | `resolution.status` |
| `resolved_at` | `timestamps.resolved_at` |
| `current_end_timestamp` | `timestamps.end_timestamp` |
| `created_at` | `timestamps.created_at` |
| `category` | `category` |

## 价格精度

- 42.space 返回的价格为高精度数值 (18位小数)
- 需除以 1e18 转换为 0-1 范围的概率值
- 示例: `875583268542512` → `0.000875583268542512`

## 体积单位

- 42.space 返回的 volume 为 wei 单位
- 需除以 1e18 转换为近似 USD 值

## 更新日志

- 2026-02-27: 初始版本
