# 42.space GraphQL Schema 摘要

> 生成时间: 2026-02-27
> 来源: Introspection Query

## 概述

42.space 使用 Hasura GraphQL Engine，提供丰富的查询类型。主要数据模型围绕**预测市场**设计。

---

## 核心 Query 类型

### Root Query (`query_root`)

| 字段 | 类型 | 描述 |
|------|------|------|
| `category` | `[category]` | 市场分类 |
| `subcategory` | `[subcategory]` | 子分类 |
| `tag` | `[tag]` | 标签 |
| `topic` | `[topic]` | 主题 |
| `collateral_token` | `[collateral_token]` | 抵押代币 |
| `mint_curve` | `[mint_curve]` | Mint 曲线 |
| `home_market_list` | `[home_market_list]` | 首页市场列表 |
| `home_market_stats` | `[home_market_stats]` | 首页市场统计 |
| `market` | `[market]` | 市场列表 |
| `market_by_pk` | `market` | 单一市场 (by address) |
| `question` | `[question]` | 问题列表 |
| `question_by_pk` | `question` | 单一问题 |
| `question_status` | `[question_status]` | 问题状态 |
| `question_metadata` | `[question_metadata]` | 问题元数据 |
| `question_category` | `[question_category]` | 问题-分类关联 |
| `outcome` | `[outcome]` | 结果列表 |
| `outcome_by_pk` | `outcome` | 单一结果 |
| `outcome_stats` | `[outcome_stats]` | 结果统计 |
| `current_outcome_stats` | `[current_outcome_stats]` | 当前结果统计 |
| `current_market_stats` | `[current_market_stats]` | 当前市场统计 |
| `user_positions` | `[user_positions]` | 用户持仓 |
| `user_positions_by_pk` | `user_positions` | 特定持仓 |
| `current_user_stats` | `[current_user_stats]` | 当前用户统计 |
| `current_user_stats_ranked` | `[current_user_stats_ranked]` | 排行榜 |
| `ledger` | `[ledger]` | 账本记录 |
| `mint_swap` | `[mint_swap]` | Mint 交易 |
| `redeem_swap` | `[redeem_swap]` | 赎回交易 |
| `onchain_event` | `[onchain_event]` | 链上事件 |
| `historical_midpoint` | `[historical_midpoint]` | 历史中间价 |
| `historical_ohlc` | `[historical_ohlc]` | K线数据 |
| `leaderboard_best_single_trades` | `[leaderboard_best_single_trades]` | 最佳单笔交易 |

---

## 主要对象类型

### Market (市场)

```
market {
  address              # 市场合约地址
  question_id          # 问题ID
  created_at           # 创建时间
  # ... 更多字段
}
```

### Question (问题)

```
question {
  question_id          # 问题ID (primary key)
  title                # 标题
  description          # 描述
  created_at           # 创建时间
  block_timestamp      # 区块链时间戳
  # ... 更多字段
}
```

### Outcome (结果/选项)

```
outcome {
  question_id          # 问题ID
  token_id             # 代币ID
  # ... 更多字段
}
```

### User Positions (用户持仓)

```
user_positions {
  user_address         # 用户地址
  market_address       # 市场地址
  question_id          # 问题ID
  token_id             # 代币ID
  current_quantity     # 当前数量
  avg_price            # 平均价格
  cost_basis           # 成本
  realized_pnl         # 已实现盈亏
  is_claimed           # 是否已申领
  is_finalized         # 是否已结算
  # ... 更多字段
}
```

### Current Market Stats (市场统计)

```
current_market_stats {
  market_address       # 市场地址
  # volume_24h         # 24小时交易量
  # liquidity          # 流动性
  # ... 更多字段
}
```

---

## 枚举类型 (Enum)

| 枚举名 | 描述 |
|--------|------|
| `question_status_select_column` | 问题状态列选择 |
| `question_select_column` | 问题列选择 |
| `market_select_column` | 市场列选择 |
| `outcome_select_column` | 结果列选择 |
| `user_positions_select_column` | 用户持仓列选择 |
| `category_select_column` | 分类列选择 |

---

## 输入类型 (Input Types)

### 条件过滤 (`_eq`, `_neq`, `_gt`, `_lt`, 等)

```graphql
# 示例: 过滤特定分类的市场
where: { category: { _eq: "Crypto" } }

# 示例: 过滤状态为 live 的问题
where: { status: { _eq: "live" } }

# 示例: 多条件
where: {
  _and: [
    { category: { _eq: "Crypto" } }
    { status: { _eq: "live" } }
  ]
}
```

### 排序

```graphql
order_by: { created_at: desc }
order_by: { volume: asc }
order_by: { title: asc, created_at: desc }
```

---

## Subscription (订阅)

支持实时数据推送:

- `question_stream` - 问题实时更新
- `market_stream` - 市场实时更新
- `outcome_stream` - 结果实时更新
- `ledger_stream` - 账本实时更新
- `user_positions_stream` - 持仓实时更新

---

## 聚合查询 (Aggregate)

支持 count, sum, avg, max, min 等聚合:

```graphql
question_aggregate {
  aggregate {
    count
    sum { ... }
    avg { ... }
  }
}
```

---

## 常用过滤器

| 过滤器 | 用途 |
|--------|------|
| `_eq` | 等于 |
| `_neq` | 不等于 |
| `_in` | 在列表中 |
| `_nin` | 不在列表中 |
| `_gt`, `_gte` | 大于/大于等于 |
| `_lt`, `_lte` | 小于/小于等于 |
| `_like` | LIKE 匹配 |
| `_ilike` | 大小写不敏感匹配 |
| `_is_null` | 是否为空 |

---

## 相关文档

- [API 端点](./graphql-endpoints.md)
- [查询示例](./graphql-queries-samples.md)
