# 42.space Web App API 端点发现（反向工程）

> 结论先行：42.space 当前（2026-02-27）Web App 里能观察到至少 1 个核心 GraphQL 端点，以及若干辅助端点（地理位置、登录/钱包等）。

## 发现方法

- 打开 https://www.42.space
- 使用浏览器 `performance.getEntriesByType('resource')` 抓取资源请求列表
- 过滤包含 `api/graphql/rpc/v1/v2/indexer` 等关键词的 URL

## 观测到的端点（初步）

### 1) 核心 GraphQL

- **GraphQL Endpoint**：`https://ft.42.space/v1/graphql`
- **用途推测**：市场列表、事件/合约信息、订单簿/价格、用户头寸（需进一步验证）

下一步（待做）：
- 记录常见 query 名称（可通过 Network/XHR 或在页面触发更多操作后再抓 resource）
- 尝试 introspection（如果未禁用）以生成 schema

### 2) Web App 辅助接口

- `https://www.42.space/api/geo`
  - 用途推测：地区限制/合规相关判断

### 3) 第三方登录/钱包相关（非 42 后端核心数据）

- Privy（登录/分析）：
  - `https://auth.privy.io/api/v1/apps/<appId>`
  - `https://auth.privy.io/api/v1/analytics_events`
- WalletConnect explorer：
  - `https://explorer-api.walletconnect.com/v3/wallets?...`

> 注意：这些端点更多是认证/钱包体验，不等于市场数据 API。

## 风险与注意事项

- 反向工程只记录“公开可见请求”，不尝试绕过权限、不抓取私有数据。
- 后端可能仍在快速迭代；端点、字段会变化。

## 下一步计划

1) 在 42.space 页面多操作（切换市场、打开详情、搜索、排序）后再次抓取 resource 列表，补全端点。
2) 对 `ft.42.space/v1/graphql` 测试：
   - 是否支持 introspection
   - 限速/错误码
   - 必要 header（如有）
3) 将 schema 与常用 query 写入知识库：`knowledge/notes/graphql-schema.md`
