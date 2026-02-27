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

## 11. 获取事件详情（通过 question_id）

```graphql
query {
  question_by_pk(question_id: "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74") {
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
}
```

**响应:**
```json
{
  "data": {
    "question_by_pk": {
      "question_id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74",
      "title": "Gold price range, Mar 5th?",
      "description": "## Resolution Criteria\nThis market resolves to the range containing the \"Close\" price...",
      "created_at": "2026-02-26T09:00:44.586748+00:00",
      "question_categories": [
        {
          "category_id": "4",
          "category": {"name": "Economy"}
        }
      ],
      "outcomes": [
        {"id": "747", "token_id": "1"},
        {"id": "748", "token_id": "2"},
        {"id": "749", "token_id": "4"},
        {"id": "750", "token_id": "8"},
        {"id": "751", "token_id": "16"},
        {"id": "752", "token_id": "32"}
      ]
    }
  }
}
```

---

## 12. 获取 Outcome 元数据

```graphql
query {
  outcome_metadata(where: {question_id: {_eq: "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74"}}) {
    id
    question_id
    token_id
    symbol
    description
  }
}
```

**响应:**
```json
{
  "data": {
    "outcome_metadata": [
      {"id": "3496", "question_id": "...", "token_id": "1", "symbol": "Below $4845"},
      {"id": "3497", "question_id": "...", "token_id": "2", "symbol": "$4845 – $5055"},
      {"id": "3498", "question_id": "...", "token_id": "4", "symbol": "$5055 – $5205"},
      {"id": "3499", "question_id": "...", "token_id": "8", "symbol": "$5205 – $5355"},
      {"id": "3500", "question_id": "...", "token_id": "16", "symbol": "$5355 – $5570"},
      {"id": "3501", "question_id": "...", "token_id": "32", "symbol": "Above $5570"}
    ]
  }
}
```

---

## 13. 获取市场统计（通过 market_address）

```graphql
query {
  current_market_stats(where: {market_address: {_eq: "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd"}}) {
    market_address
    total_volume
    buy_volume
    sell_volume
    traders
    collateral
  }
}
```

**响应:**
```json
{
  "data": {
    "current_market_stats": [{
      "market_address": "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd",
      "total_volume": "272288439817463587147",
      "buy_volume": "186590301517084694489",
      "sell_volume": "85698138300378892658",
      "traders": 10,
      "collateral": "98958638431685404950"
    }]
  }
}
```

---

## 14. 获取各 Outcome 的实时统计

```graphql
query {
  current_outcome_stats(where: {question_id: {_eq: "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74"}}) {
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
```

**响应:**
```json
{
  "data": {
    "current_outcome_stats": [
      {"token_id": "32", "marginal_price": "875583268542512", "collateral": "5007757490332744468", "traders": 1},
      {"token_id": "4", "marginal_price": "1907463806830087", "collateral": "32192652592093818168", "traders": 6},
      {"token_id": "16", "marginal_price": "1010199178825209", "collateral": "6991432226372406059", "traders": 2},
      {"token_id": "1", "marginal_price": "875583268542512", "collateral": "5007757490332744468", "traders": 1},
      {"token_id": "8", "marginal_price": "2070027498992837", "collateral": "42767606406181285728", "traders": 8},
      {"token_id": "2", "marginal_price": "1010199178825209", "collateral": "6991432226372406059", "traders": 2}
    ]
  }
}
```

---

## 15. 通过 market_by_pk 获取事件地址对应的信息

```graphql
query {
  market_by_pk(address: "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd") {
    address
    question_id
    created_at
  }
}
```

**响应:**
```json
{
  "data": {
    "market_by_pk": {
      "address": "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd",
      "question_id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74",
      "created_at": "2026-02-26T09:00:45.588423+00:00"
    }
  }
}
```

---

## 关键表/查询汇总

| 表/查询 | 用途 | 关键字段 |
|---------|------|----------|
| `question_by_pk` | 获取事件/问题详情 | question_id, title, description, created_at |
| `market_by_pk` | 获取市场地址信息 | address, question_id, created_at |
| `outcome` | 获取事件的所有 outcomes | id, question_id, token_id |
| `outcome_metadata` | 获取 outcome 的显示信息 | token_id, symbol, description |
| `current_market_stats` | 获取市场整体统计 | total_volume, buy_volume, sell_volume, traders, collateral |
| `current_outcome_stats` | 获取各 outcome 的实时统计 | token_id, marginal_price, collateral, total_volume, traders |
| `question_categories` | 获取事件分类 | category_id, category.name |

---

## 重要说明

1. **event_address vs question_id**:
   - 页面 URL 中的地址（如 `0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd`）对应 `market` 表的 `address` 字段
   - 实际的事件 ID 是 `question_id`（如 `0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74`）
   - 可以通过 `market_by_pk` 查询关联

2. **token_id**:
   - 使用 2 的幂次方 (1, 2, 4, 8, 16, 32...)
   - 每个 bit 代表一个 outcome

3. **数值单位**:
   - 价格和金额使用高精度数值（字符串格式）
   - 需要除以 1e18 转换为标准单位
   - 例如: `total_volume: "272288439817463587147"` ≈ `$272.29`

## 注意事项

1. **字段验证**: 使用前建议通过 Introspection 确认字段名
2. **地址格式**: Ethereum 地址为 42 字符 (0x 开头 + 40 位 hex)
3. **时间戳**: 返回格式为 Unix timestamp 或 ISO 字符串
4. **数值**: 价格和数量通常为精确数值，使用字符串避免精度丢失

## 相关文档

- [API 端点清单](./graphql-endpoints.md)
- [Schema 摘要](./graphql-schema-summary.md)
- [事件数据模型: Gold price range, Mar 5th?](./event-gold-mar5.md)
