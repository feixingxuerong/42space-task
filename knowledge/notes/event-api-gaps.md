# 42.space Event API 分析 - 待探索事项

> 日期: 2026-02-27

## 已完成

- [x] 通过 GraphQL API 获取事件详情
- [x] 获取 outcome 元数据
- [x] 获取市场统计 (current_market_stats)
- [x] 获取 outcome 实时统计 (current_outcome_stats)
- [x] 理解 event_address 与 question_id 的关系

## 还缺什么

### 1. 价格转换公式

**问题**: API 返回的 `marginal_price` 与页面显示的赔率不一致

API 返回:
- token_id=1: marginal_price = 875583268542512
- token_id=8: marginal_price = 2070027498992837

页面显示:
- Below $4845: 11.3x
- $5205 – $5355: 1.5x

**需要**: 
- 了解 marginal_price 到页面显示价格的转换公式
- 了解是否为边际价格 vs 做市商价格的区别

### 2. 交易 API

**问题**: 只读 API 已覆盖，但交易功能（买入/卖出）的 API 未知

**需要**:
- 下单接口 (buy/sell)
- 交易确认/状态查询
- 仓位管理 (持仓查询)

### 3. 用户认证

**问题**: 当前 API 无需认证，但交易需要

**需要**:
- 登录/认证方式
-钱包连接 API
- 签名验证

### 4. 历史数据

**问题**: 只有当前实时数据

**需要**:
- 历史价格数据 (historical_midpoint, historical_ohlc)
- 交易历史

### 5. 结算/兑付 API

**问题**: 结算后的兑付流程未知

**需要**:
- 结算结果查询
- 奖金领取接口

### 6. 字段完整性验证

- `question.status` 字段未找到 (通过 `question_status` 表代替)
- `question.end_date` / `ends未找到
-_at` 字段 `outcome.title` 字段未outcome_metadata.symbol找到 (通过 `` 代替)

## 测试脚本

已创建: `42space-task测试脚本目录/test-*.js`

- test-event.js ~ test-event-final.js: 事件 API 测试
- test-introspection.js: Schema introspection 测试
