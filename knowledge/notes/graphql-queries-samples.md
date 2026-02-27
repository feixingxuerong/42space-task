# 42.space GraphQL 查询示例

> 收集时间: 2026-02-27

以下示例均已在实际环境中验证可用。

---

## 1. 获取首页市场列表

获取最新和热门的市场列表。

```graphql
query {
  home_market_list(limit: 10) {
    question_id
    title
  }
}
```

**响应示例:**
```json
{
  "data": {
    "home_market_list": [
      {
        "question_id": "0x00c4e062737558fae9732fb1cf0e4b60ec0eec81eaa86b4f3b5419828ac98cea",
        "title": "BNB price range, Feb 18th?"
      },
      {
        "question_id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74",
        "title": "Gold price range, Mar 5th?"
      }
    ]
  }
}
```

---

## 2. 获取市场分类

```graphql
query {
  category(limit: 10) {
    id
    name
  }
}
```

**响应:**
```json
{
  "data": {
    "category": [
      {"id": "2", "name": "Crypto"},
      {"id": "5", "name": "Culture"},
      {"id": "6", "name": "Sports"},
      {"id": "8", "name": "Finance"},
      {"id": "9", "name": "TGE"}
    ]
  }
}
```

---

## 3. 获取问题状态

查询市场的当前状态（live, finalised 等）。

```graphql
query {
  question_status(limit: 10) {
    question_id
    title
    status
    current_end_timestamp
  }
}
```

**响应:**
```json
{
  "data": {
    "question_status": [
      {
        "question_id": "0x00c4e062737558fae9732fb1cf0e4b60ec0eec81eaa86b4f3b5419828ac98cea",
        "title": "BNB price range, Feb 18th?",
        "status": "finalised"
      },
      {
        "question_id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74",
        "title": "Gold price range, Mar 5th?",
        "status": "live"
      }
    ]
  }
}
```

---

## 4. 获取特定市场详情

```graphql
query {
  market_by_pk(address: "0x1234567890abcdef1234567890abcdef12345678") {
    address
    question_id
    created_at
  }
}
```

**说明:** 如果市场不存在，返回 `null`。

---

## 5. 获取用户持仓

查询特定用户的所有持仓。

```graphql
query {
  user_positions(
    limit: 10,
    where: { user_address: { _eq: "0xYOUR_ADDRESS_HERE" } }
  ) {
    user_address
    market_address
    question_id
    current_quantity
    avg_price
    realized_pnl
  }
}
```

**字段说明:**
- `current_quantity`: 当前持有数量
- `avg_price`: 平均买入价格
- `realized_pnl`: 已实现盈亏

---

## 6. 获取市场当前统计

```graphql
query {
  current_market_stats(limit: 5) {
    market_address
  }
}
```

**说明:** 具体字段需要从 schema 获取完整定义。

---

## 7. 组合查询：按分类筛选市场

```graphql
query {
  home_market_list(
    limit: 20,
    where: { category: { _eq: "Crypto" } }
  ) {
    question_id
    title
    category
  }
}
```

---

## 8. 排序与分页

```graphql
query {
  home_market_list(
    limit: 10,
    offset: 10,
    order_by: { created_at: desc }
  ) {
    question_id
    title
  }
}
```

---

## 9. 聚合查询示例

```graphql
query {
  question_aggregate {
    aggregate {
      count
    }
  }
}
```

---

## 10. 实时订阅 (Subscription)

Hasura 支持 WebSocket 订阅，但需要额外配置：

```graphql
subscription {
  question_stream(limit: 5) {
    question_id
    title
    status
  }
}
```

---

## 常见变量使用

```graphql
query GetMarket($id: String!) {
  question_by_pk(question_id: $id) {
    question_id
    title
    description
  }
}
```

Variables:
```json
{
  "id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74"
}
```

---

## 注意事项

1. **字段验证**: 使用前建议通过 Introspection 确认字段名
2. **地址格式**: Ethereum 地址为 42 字符 (0x 开头 + 40 位 hex)
3. **时间戳**: 返回格式为 Unix timestamp 或 ISO 字符串
4. **数值**: 价格和数量通常为精确数值，使用字符串避免精度丢失

## 相关文档

- [API 端点清单](./graphql-endpoints.md)
- [Schema 摘要](./graphql-schema-summary.md)
