# 42.space 知识库索引（Index）

> 目标：快速摸清 42.space 的产品规则、结算口径、费用结构、风险点，以及可用的只读数据接口/端点。

## 章节

- **产品概览**：核心概念、市场类型、参与方式
- **交易机制**：价格/概率、订单类型（如有）、撮合与费用（如有）
- **结算与争议**：结算来源、争议流程、极端情况
- **风控与合规**：限制、KYC/地区限制（如有）、账户安全
- **数据/API（只读）**：
  - Web App 调用的后端接口（反向工程）→ `notes/api-discovery.md`
  - **GraphQL API**:
    - `notes/graphql-endpoints.md` - API 端点清单
    - `notes/graphql-queries-samples.md` - 查询示例
    - `notes/graphql-schema-summary.md` - Schema 摘要
  - **标准化数据**:
    - `notes/normalized-schema.md` - 统一市场数据格式
  - **采集脚本**:
    - `scripts/fetch-markets.mjs` - 抓取原始市场数据
    - `scripts/normalize-market.mjs` - 转换为标准化格式
    - `outputs/markets-normalized-*.json` - 标准化输出文件
  - 官方文档中披露的接口（如果有）
- **案例库**：典型市场的规则拆解、口径陷阱

## 更新规则（Index-first）

1. 新增笔记前先在本索引添加条目
2. 新增来源先更新 `sources.md`
3. 每次重要结论给出：来源链接 + 时间戳 + 关键假设

