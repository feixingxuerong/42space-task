# Event: Gold price range, Mar 5th?

> 事件地址: `0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd`
> Question ID: `0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74`

## 基本信息

| 字段 | 值 |
|------|-----|
| 标题 | Gold price range, Mar 5th? |
| 分类 | Economy |
| 创建时间 | 2026-02-26T09:00:44.586748+00:00 |
| 状态 | live |

## 结算信息

- **结算标准**: 该市场将根据 Yahoo Finance 历史数据中 3 月 5 日的"收盘价"所在的范围进行结算
- **数据源**: [Yahoo Finance Historical Data](https://finance.youtube.com/quote/GC%3DF/history/)
- **注意**: 市场结算结果完全取决于 Yahoo Finance 历史数据的"收盘价"，其他来源的价格不作为结算依据

## Outcomes (6个结果)

| token_id | 范围 | 描述 |
|----------|------|------|
| 1 | Below $4845 | 黄金收盘价低于 $4845 |
| 2 | $4845 – $5055 | 黄金收盘价在 $4845 到 $5055 之间 |
| 4 | $5055 – $5205 | 黄金收盘价在 $5055 到 $5205 之间 |
| 8 | $5205 – $5355 | 黄金收盘价在 $5205 到 $5355 之间 |
| 16 | $5355 – $5570 | 黄金收盘价在 $5355 到 $5570 之间 |
| 32 | Above $5570 | 黄金收盘价高于 $5570 |

## 市场统计

| 指标 | 值 |
|------|-----|
| 总交易量 (total_volume) | 272288439817463587147 (≈ $272.29) |
| 买入量 (buy_volume) | 186590301517084694489 |
| 卖出量 (sell_volume) | 85698138300378892658 |
| 交易者数量 (traders) | 10 |
| 抵押品 (collateral) | 98958638431685404950 (≈ $98.96) |

## 各Outcome统计

| token_id | 描述 | marginal_price | collateral | total_volume | traders |
|-----------|------|----------------|------------|--------------|---------|
| 1 | Below $4845 | 875583268542512 | 5007757490332744468 | 5007757490332744468 | 1 |
| 2 | $4845 – $5055 | 1010199178825209 | 6991432226372406059 | 7007301624260723352 | 2 |
| 4 | $5055 – $5205 | 1907463806830087 | 32192652592093818168 | 61029055761907475064 | 6 |
| 8 | $5205 – $5355 | 2070027498992837 | 42767606406181285728 | 187229265826369176443 | 8 |
| 16 | $5355 – $5570 | 1010199178825209 | 6991432226372406059 | 7007301624260723352 | 2 |
| 32 | Above $5570 | 875583268542512 | 5007757490332744468 | 5007757490332744468 | 1 |

## GraphQL 查询示例

### 1. 获取事件基本信息

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

### 2. 获取Outcome元数据

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

### 3. 获取当前市场统计

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

### 4. 获取各Outcome的实时统计

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

### 5. 完整的事件数据查询（组合查询）

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
  }
  
  outcome_metadata(where: {question_id: {_eq: "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74"}}) {
    token_id
    symbol
  }
  
  current_market_stats(where: {market_address: {_eq: "0xa3C62f3d1fA882cC1Fa17b0070D6AF4D4707e1Fd"}}) {
    total_volume
    traders
    collateral
  }
  
  current_outcome_stats(where: {question_id: {_eq: "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74"}}) {
    token_id
    marginal_price
    collateral
    total_volume
  }
}
```

## 数据模型总结

### question 表
- `question_id`: 主键 (hash)
- `title`: 事件标题
- `description`: 结算标准和描述
- `created_at`: 创建时间

### market 表
- `address`: 市场合约地址
- `question_id`: 关联的问题ID
- `created_at`: 创建时间

### outcome 表
- `id`: Outcome ID
- `question_id`: 关联的问题ID
- `token_id`: 合约代币ID (1, 2, 4, 8, 16, 32)

### outcome_metadata 表
- `id`: 元数据ID
- `question_id`: 关联的问题ID
- `token_id`: 代币ID
- `symbol`: 显示名称
- `description`: 描述

### current_market_stats 表
- `market_address`: 市场地址
- `total_volume`: 总交易量
- `buy_volume`: 买入量
- `sell_volume`: 卖出量
- `traders`: 交易者数量
- `collateral`: 抵押品/流动性

### current_outcome_stats 表
- `question_id`: 问题ID
- `token_id`: 代币ID
- `market_address`: 市场地址
- `marginal_price`: 边际价格
- `collateral`: 该Outcome的抵押品
- `total_volume`: 该Outcome的交易量
- `buy_volume`: 买入量
- `sell_volume`: 卖出量
- `traders`: 交易者数量
- `updated_at`: 更新时间

## 待探索

- marginal_price 与页面显示价格的转换关系
- 如何计算当前赔率/概率
- 交易功能 API
