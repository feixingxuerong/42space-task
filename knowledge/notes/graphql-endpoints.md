# 42.space GraphQL API 端点文档

> 最后更新: 2026-02-27
> 状态: 只读 API 已验证可用

## 概述

42.space 提供基于 Hasura 的 GraphQL API，位于 `https://ft.42.space/v1/graphql`。

## 基础信息

| 属性 | 值 |
|------|-----|
| 端点 | `https://ft.42.space/v1/graphql` |
| 类型 | Hasura GraphQL Engine |
| 支持 Introspection | ✅ 是 |
| 认证 | 可选 (部分查询无需认证) |
| CORS | 支持 (Origin: https://www.42.space) |

## 注意事项

1. **只读优先**: 该 API 主要用于读取市场数据、用户持仓、排行榜等公开信息
2. **请求头建议**:
   ```
   Content-Type: application/json
   Origin: https://www.42.space
   Referer: https://www.42.space/
   User-Agent: Mozilla/5.0 (兼容浏览器)
   ```
3. **字段验证**: 部分字段在不同版本可能有变化，建议先用 `home_market_list` 测试连接
4. **分页**: 支持 `limit` 和 `offset` 参数
5. **排序**: 支持 `order_by` 参数，格式为 `{字段: asc|desc}`

## 主要 Query 类型

### 1. 市场相关 (Markets)

| Query | 用途 |
|-------|------|
| `home_market_list` | 获取首页市场列表 |
| `market_by_pk` | 通过地址获取市场详情 |
| `current_market_stats` | 获取当前市场统计数据 |
| `market_aggregate` | 市场聚合查询 |
| `question_status` | 获取问题状态 |

### 2. 结果/赔率相关 (Outcomes)

| Query | 用途 |
|-------|------|
| `outcome_by_pk` | 获取特定结果详情 |
| `outcome_stats` | 获取结果统计数据 |
| `current_outcome_stats` | 获取当前结果统计 |

### 3. 用户相关 (Users)

| Query | 用途 |
|-------|------|
| `user_positions` | 获取用户持仓 |
| `user_positions_by_pk` | 获取特定持仓详情 |
| `current_user_stats` | 获取当前用户统计 |
| `current_user_stats_ranked` | 获取排行榜数据 |
| `user_trading_stats_daily` | 用户每日交易统计 |
| `user_trading_stats_lifetime` | 用户 lifetime 统计 |

### 4. 分类/标签 (Categories & Tags)

| Query | 用途 |
|-------|------|
| `category` | 获取市场分类列表 |
| `tag` | 获取标签列表 |
| `topic` | 获取主题列表 |
| `subcategory` | 获取子分类列表 |

### 5. 交易记录 (Ledgers)

| Query | 用途 |
|-------|------|
| `ledger` | 获取账本记录 |
| `mint_swap` | Mint 交易记录 |
| `redeem_swap` | 赎回交易记录 |

### 6. 历史数据 (Historical)

| Query | 用途 |
|-------|------|
| `historical_midpoint` | 历史中间价 |
| `historical_ohlc` | K线数据 |
| `outcome_stats_changes` | 价格变化数据 |

### 7. 链上事件 (Events)

| Query | 用途 |
|-------|------|
| `onchain_event` | 链上事件 |
| `raw_event` | 原始事件 |

## 示例请求

### curl 示例

```bash
curl -X POST "https://ft.42.space/v1/graphql" \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.42.space" \
  -d '{"query":"{ home_market_list(limit: 5) { question_id title } }"}'
```

### JavaScript 示例

```javascript
const response = await fetch('https://ft.42.space/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://www.42.space'
  },
  body: JSON.stringify({
    query: `{
      home_market_list(limit: 5) {
        question_id
        title
      }
    }`
  })
});
const data = await response.json();
```

## 常见错误处理

| 错误信息 | 原因 |
|---------|------|
| `PersistedQueryNotSupported` | 端点需要完整 query，不能仅发送 hash |
| `field 'xxx' not found` | 字段名不存在，检查 schema |
| 403 Forbidden | 可能需要正确的 Origin 头 |

## 限制与约束

1. **Mutation**: 本文档仅记录只读查询，不涉及任何写入操作
2. **Rate Limiting**: 未公开明确限制，建议合理使用
3. **数据延迟**: 实时数据可能有轻微延迟

## 相关链接

- [GraphQL 示例查询](./graphql-queries-samples.md)
- [Schema 摘要](./graphql-schema-summary.md)
- 官网: https://www.42.space
- 文档: https://docs.42.space
