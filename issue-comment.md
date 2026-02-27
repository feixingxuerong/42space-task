## 已完成实现

### 运行命令

```bash
# 抓取原始数据
node scripts/fetch-markets.mjs --limit 20 --offset 0

# 生成标准化快照（自动抓取并转换）
node scripts/normalize-market.mjs --limit 20

# 使用已有原始数据转换
node scripts/normalize-market.mjs --input ../data/markets-raw.json
```

### 输出示例

已生成 `outputs/markets-normalized-2026-02-27.json`，包含:

```json
{
  "platform": "42space",
  "market_id": "0x02515dd203b0b2946746c0e0d612cecca98c608595a6bddd9033d0aa23c75a74",
  "title": "Gold price range, Mar 5th?",
  "outcomes": [
    {
      "token_id": 1,
      "symbol": "Below $4845",
      "price": 0.000875583268542512,
      "volume": 5.007757490332745,
      "traders": 1
    }
  ],
  "volume": {
    "total": 272.29,
    "buy": 186.59,
    "sell": 85.70
  },
  "category": "Economy",
  "timestamps": {
    "created_at": "2026-02-26T09:00:44.586748+00:00",
    "updated_at": "2026-02-27T08:13:16.32102+00:00"
  }
}
```

### 交付物

- scripts/fetch-markets.mjs - 抓取核心数据（含分页/限速/重试）
- scripts/normalize-market.mjs - 转换为 normalized schema
- outputs/markets-normalized-YYYY-MM-DD.json - 标准化输出
- knowledge/notes/normalized-schema.md - Schema 文档
- knowledge/index.md / sources.md - 已更新

### 已知限制

1. 字段缺失: 部分 GraphQL 字段不存在于当前 schema（如 status, resolved_at, current_end_timestamp），已简化查询以兼容
2. 分页字段: home_market_list 不支持 order_by 参数，无法自定义排序
3. 费用数据: 42.space API 未提供交易费用数据，fees 字段暂为 null
4. 结算结果: resolution.result 需要额外查询，暂时为 null
5. 每日定时: GitHub Actions 定时任务待实现

---
已 push 到 main 分支 (commit 018a2fc)
