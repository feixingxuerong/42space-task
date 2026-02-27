# 42 Space 文档站点地图

> 更新时间：2026-02-27  
> 源站：https://docs.42.space

## 文档结构总览

```
docs.42.space
├── 入门指南 (Getting Started)
│   ├── Quickstart / Introduction to 42
│   │   └── [快速入门] 什么是42Markets
│   ├── App Guide (应用指南)
│   │   ├── Onboarding (账户创建与资金)
│   │   └── Trading Event Futures (交易基础)
│   └── Protocol Mechanics 101 (协议机制)
│       ├── Glossary (术语表)
│       ├── 42 Markets (42市场机制)
│       ├── 42 Power Curves (定价曲线)
│       ├── 42 Outcome Tokens (结果代币)
│       │   ├── Market Discovery / Pre-Resolution (交易阶段)
│       │   └── Post-Resolution (结算后)
│       ├── Convex Payout Dynamics (收益动态)
│       ├── Playbook to Profiting (盈利指南)
│       ├── Fees (费用说明)
│       └── 42 Points & Referral Program (积分与推荐)
```

---

## 详细页面链接

### 1. 首页 / 介绍
- **URL**: https://docs.42.space
- **内容**: 42协议概述，核心特性介绍

### 2. Quickstart (快速入门)
- **URL**: https://docs.42.space/getting-started/quickstart
- **内容**: 42是什么、去中心化资产发行协议、连续交易+ pari-mutuel结算

### 3. Protocol Mechanics 101 (协议机制101)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101
- **内容**: 核心架构和高级概念索引页

### 4. Glossary (术语表)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/glossary
- **关键术语**:
  - Events Futures (事件期货)
  - 42 Market (42市场)
  - Outcome Tokens (结果代币)
  - Power Curve (幂曲线)
  - Redeem Tax (赎回税)
  - Resolution (结算)

### 5. 42 Markets (42市场)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-markets
- **核心内容**:
  - 连续交易 + pari-mutuel结算
  - 市场生命周期：Phase 1 (Market Discovery) → Phase 2 (Outcome Resolution)
  - 三个核心属性：持续活动、清洁资本重分配、无固定天花板

### 6. 42 Power Curves (定价曲线)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-power-curves
- **核心内容**:
  - 首次定价作为一等设计目标
  - 单边AMM机制，边际定价
  - 曲线设计目标：奖励早期信息、惩罚晚期低信心入场
  - 市场规模适应性

### 7. 42 Outcome Tokens (结果代币)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens
- **核心内容**:
  - ERC-6909标准，可转移
  - 交易生命周期：Pre-Resolution → Post-Resolution

### 8. Market Discovery / Pre-Resolution (交易阶段)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens/market-discovery-pre-resolution
- **核心操作**:
  - Mint (买入): 基于曲线创建新代币
  - Redeem (卖出): 销毁代币换回抵押品
- **赎回税机制**:
  - 规模敏感
  - 流动性敏感
  - 时间敏感

### 9. Post-Resolution (结算后)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-outcome-tokens/post-resolution
- **核心内容**:
  - Oracle触发与结算
  - 单胜出结果
  - 收益计算公式

### 10. Convex Payout Dynamics (收益动态)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/convex-payout-dynamics
- **核心内容**:
  - 凸性来源：时间、定位、资本流动
  - 早期参与者的优势
  - 收益由三个因素决定

### 11. Playbook to Profiting (盈利指南)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/playbook-to-profiting
- **两种盈利路径**:
  1. 交易获利：买低卖高
  2. 持币获利：持有正确结果代币至结算
- **重要特性**: 即使预测错误仍可盈利

### 12. Fees (费用)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/fees
- **费率**: 
  - 协议费: 0.8% (Mint/Redeem)
  - 赎回税: 动态计算

### 13. 42 Points & Referral Program (积分与推荐)
- **URL**: https://docs.42.space/getting-started/protocol-mechanics-101/42-points-and-referral-program
- **积分规则**:
  - Mint/Redeem: 10积分/USDT
  - 持有Winning OT: 10积分/USDT
  - 持有Losing OT: 30积分/USDT
- **推荐奖励**: 推荐人5%/7.5%，被推荐人+1%
