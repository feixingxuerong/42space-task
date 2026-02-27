# 42 Space 文档来源

> 更新日期：2026-02-27

## 主站点

- **文档站**: https://docs.42.space

## 关键页面来源

| 页面 | URL | 状态 |
|------|-----|------|
| 首页 | https://docs.42.space | ✅ |
| Quickstart | https://docs.42.space/getting-started/quickstart | ✅ |
| App Guide | https://docs.42.space/getting-started/publish-your-docs | ✅ |
| Protocol Mechanics 101 | https://docs.42.space/getting-started/protocol-mechanics-101 | ✅ |
| Glossary | https://docs.42.space/getting-started/protocol-mechanics-101/glossary | ✅ |
| 42 Markets | https://docs.42.space/getting-started/protocol-mechanics-101/42-markets | ✅ |
| 42 Power Curves | https://docs.42.space/getting-started/protocol-mechanics-101/42-power-curves | ✅ |
| 42 Outcome Tokens | https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens | ✅ |
| Market Discovery (Pre-Resolution) | https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens/market-discovery-pre-resolution | ✅ |
| Post-Resolution | https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens/post-resolution | ✅ |
| Convex Payout Dynamics | https://docs.42.space/getting-started/protocol-mechanics-101/convex-payout-dynamics | ✅ |
| Playbook to Profiting | https://docs.42.space/getting-started/protocol-mechanics-101/playbook-to-profiting | ✅ |
| Fees | https://docs.42.space/getting-started/protocol-mechanics-101/fees | ✅ |
| 42 Points & Referral Program | https://docs.42.space/getting-started/protocol-mechanics-101/42-points-and-referral-program | ✅ |

---

## 知识库文件

- `knowledge/notes/docs-map.md` - 文档站点地图
- `knowledge/notes/product-rules.md` - 产品规则摘要
- `knowledge/notes/graphql-endpoints.md` - GraphQL API 端点文档
- `knowledge/notes/graphql-queries-samples.md` - GraphQL 查询示例
- `knowledge/notes/graphql-schema-summary.md` - GraphQL Schema 摘要
- `knowledge/notes/normalized-schema.md` - 标准化市场数据格式

---

## 采集脚本

| 脚本 | 用途 | 状态 |
|------|------|------|
| `scripts/fetch-markets.mjs` | 抓取 42.space 原始市场数据 | ✅ |
| `scripts/normalize-market.mjs` | 转换为标准化 JSON 格式 | ✅ |
| `outputs/markets-normalized-*.json` | 标准化输出文件 | ✅ |

---

## API 来源

| 类型 | 端点 | 状态 |
|------|------|------|
| GraphQL (主) | https://ft.42.space/v1/graphql | ✅ 已验证 |
| GraphQL Introspection | https://ft.42.space/v1/graphql | ✅ 已支持 |

---

## 采集说明

- 采集方式: web_fetch + Node.js HTTPS 请求
- 采集日期: 2026-02-27
- 采集模型: minimax-cn/MiniMax-M2.5
