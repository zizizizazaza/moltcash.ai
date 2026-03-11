# LOKA AIUSD Dashboard — 开发进度总览

> 最后更新：2026-03-11  
> 整体进度：**~70%**（Phase 0-11 后端 + API 完成，前端部分已对接）

---

## Phase 0: 基础设施 ✅

- [x] 项目初始化（React 19 + Vite + TypeScript）
- [x] 前端页面骨架（13 个组件 + 页面路由）
- [x] Tailwind CSS + 设计系统（COLORS / 图标组件）
- [x] 后端搭建（Express 5 + TypeScript + Prisma ORM）
- [x] 数据库设计（14 个 Model + SQLite）
- [x] 种子数据（7 个项目 + demo 用户 + 国库快照）
- [x] JWT 认证中间件（authRequired / authOptional / authWithUser）
- [x] WebSocket 基础（Socket.IO 用户/群组房间）
- [x] Vite 代理配置（/api → :3002, /ws → :3002）
- [x] 项目结构整理（src/ + server/ + docs/）
- [x] 文档体系（PRD v3.0 + ARCHITECTURE + API + DEVELOPMENT）
- [x] README 重写

---

## Phase 1: 认证 & AI 聊天 ✅

- [x] 邮箱登录（POST /auth/login/email，自动注册）
- [x] OAuth 登录接口（POST /auth/login/oauth）
- [x] 获取当前用户（GET /auth/me）
- [x] 风险免责声明（POST /auth/accept-risk + RiskModal）
- [x] Loka AI 接入（lingyaai.cn / deepseek-v3）
- [x] SSE 流式聊天（POST /chat/stream）
- [x] 聊天历史（GET/DELETE /chat/history）
- [x] 前端 Chat.tsx 对接真实后端
- [x] AI 系统提示词（400+ 行平台知识库）

---

## Phase 2: 前端对接真实 API ✅

> API 已对接，mock 数据作为兜底（无真实数据时自动降级显示）

- [x] **Market.tsx** — 对接 GET /api/projects（替换 MOCK_ASSETS）
- [x] **Market.tsx** — 项目详情对接 GET /api/projects/:id
- [x] **Portfolio.tsx** — 对接 GET /api/portfolio/holdings（替换硬编码余额）
- [x] **Portfolio.tsx** — 对接 GET /api/portfolio/history（替换假图表数据）
- [x] **Portfolio.tsx** — 对接 GET /api/portfolio/investments
- [x] **Trade.tsx** — 对接 GET /api/trade（替换 MOCK_ORDERS）
- [x] **Trade.tsx** — 下单对接 POST /api/trade（BuyModal 已对接 api.buyTradeOrder）
- [x] **Dashboard.tsx** — 对接 GET /api/treasury/stats（替换硬编码兜底值）
- [ ] **Groups.tsx** — 验证群组消息对接正常

---

## Phase 3: 投资核心流程 ✅

> 用户端最核心的业务闭环：浏览 → 投资 → 仓位

- [x] **POST /api/projects/:id/invest** — 创建投资记录
  - [x] 金额校验（最低投资额、硬顶检查）
  - [x] 更新 project.raisedAmount
  - [x] 自动创建 PortfolioHolding
  - [x] 创建 Transaction 记录
  - [x] WebSocket 通知投资人数变化
- [x] **募资状态机**
  - [x] 项目状态流转：Fundraising → Funded（达到硬顶自动关闭）
  - [x] 达到硬顶自动关闭
  - [ ] 到期未达软顶自动失败 + 退款逻辑（需定时任务，后续实现）
- [x] **DELETE /api/projects/:id/revoke-investment** — 募资期内取消投资
- [x] **投资确认弹窗**（Market AssetDetail 内置 Pledge Box）
- [x] **投资成功后 Portfolio 实时刷新**

---

## Phase 4: Swap / AIUSD 铸造与赎回 ✅

- [x] **POST /api/portfolio/mint** — AIUSD Mint（USDC→AIUSD，含 PortfolioHolding 更新 + Transaction 记录）
- [x] **POST /api/portfolio/redeem** — AIUSD Redeem（AIUSD→USDC，余额检查 + Transaction 记录）
- [x] **Swap.tsx** — 对接铸造/赎回接口（根据 mode 自动调用 mint/redeem）
- [ ] **Swap.tsx** — 展示真实收益数据（替换假图表）
- [ ] 汇率 / 费率计算逻辑

---

## Phase 5: 项目申请 & Apply Flow ✅（后端完成，前端 UI 待建）

> PRD §6-§8：发行方上链全流程（AI Agent 引导 → 企业认证 → 项目提交）

### 5.1 Apply Group 创建
- [ ] Apply Group 类型区分（区别于社交群组）— 需产品决策
- [ ] 前端 Apply 入口 UI（从 Market 页面跳转）— 需设计

### 5.2 AI Agent 编排
- [ ] **Guide Agent**（引导代理）— 需 AI prompt 设计
- [ ] **Reviewer Agent**（审核代理）— 需 AI prompt 设计
- [ ] Agent 上下文管理（对话历史 + 状态机）

### 5.3 企业认证（Enterprise Verification）
- [x] 新增 **EnterpriseVerification** 数据模型（companyName, country, registrationNo, licenseDoc, step 1-4, status）
- [x] **POST /api/apply/enterprise/submit** — 提交法人实体信息
- [x] **GET /api/apply/enterprise** — 用户企业列表
- [x] **POST /api/apply/enterprise/:id/advance** — 推进认证步骤（每步 +25 信用分）
- [ ] UBO 检查（股权披露 + 人脸识别）— 需第三方 KYC 服务
- [x] 认证进度 4 步骤 × 25 信用分 = +100 分（已实现 recordCreditEvent）
- [ ] **SBT 铸造**（Verified Issuer Token）— 需智能合约

### 5.4 项目申请表单
- [x] 新增 **ProposedApplication** 数据模型（10+ 字段）
- [x] **POST /api/apply/projects/apply** — 提交项目申请
- [x] **GET /api/apply/projects/applications** — 申请列表
- [x] **GET /api/apply/projects/applications/:id** — 申请详情
- [ ] 收入验证（Stripe / PayPal / QuickBooks OAuth）— 需第三方凭证
- [ ] 前端 Apply Flow UI 页面 — 需设计

---

## Phase 6: 信用评分系统 ✅

> PRD §9：整个平台金融逻辑的基石

### 6.1 基础设施
- [x] 新增 **CreditScoreHistory** 数据模型
- [x] 新增 **CreditScoreEvent** 数据模型（变更原因日志）
- [x] **credit.service.ts** 服务（getTier, getTierDetails, recordCreditEvent）

### 6.2 项目方信用评分规则
- [x] 初始分 100
- [x] 企业认证 +100（4步 × 25）— ISSUER_EVENTS 常量
- [x] 募资完成 +20 / +30 / +40（按轮次递增）
- [x] 按时还款 +15~+50/月（含连续还款加成）
- [x] 提前还清 +40 + 全额 APY
- [x] 推荐项目偿还 +30

### 6.3 项目方信用惩罚
- [x] 逾期 1-30 天 -30/月
- [x] 逾期 31-90 天 -80/月
- [x] 逾期 >90 天 -150/月（触发清算）
- [x] 募资失败 -10
- [x] 欺诈/信息造假 直接归零

### 6.4 投资者信用评分
- [x] 初始分 100
- [x] 10 条得分规则实现（INVESTOR_EVENTS 常量）
- [x] KYC 完成 / 投资活跃 / 推荐 / 治理参与等

### 6.5 等级系统
- [x] Tier 1: 200 分（允许募资，30% 抵押率，0.5% 费率）
- [x] Tier 2: 500 分（10% 抵押率，0.3% 费率）
- [x] Tier 3: 1000 分（10% 抵押率，0.1% 费率）
- [x] 等级与抵押率 / 手续费联动（getTierDetails 函数）

### 6.6 信用分 API
- [x] **GET /api/credit/score** — 当前用户信用分 & 等级 & 下一等级信息
- [x] **GET /api/credit/history** — 信用分变更历史
- [x] **GET /api/credit/events** — 变更原因详情
- [x] 前端 API 方法（getCreditScore, getCreditHistory, getCreditEvents）
- [ ] **前端信用分展示 UI** — Portfolio 或独立页面

---

## Phase 7: 还款追踪 ✅

- [x] 新增 **RepaymentSchedule** 数据模型（@@unique([projectId, periodNumber])）
- [x] **GET /api/repayment/:projectId/schedule** — 查询还款计划
- [x] **POST /api/repayment/:projectId/schedule** — 发行方创建 N 期均摊计划
- [x] **POST /api/repayment/:projectId/pay/:periodNumber** — 记录还款（含投资者利息分配 + WebSocket 通知）
- [x] **POST /api/repayment/check-overdue** — 逾期检测 + 自动标记
- [x] 还款到账 → 创建 INTEREST Transaction + 触发信用加分（REPAYMENT_ON_TIME）
- [x] 前端 API 方法（getRepaymentSchedule）
- [ ] 定时任务 cron 调度（自动执行 check-overdue）— 需 cron 基础设施
- [ ] 前端还款管理 UI

---

## Phase 8: 清算机制 ✅

> PRD §10：违约处理全流程

- [x] 新增 **LiquidationEvent** 数据模型（triggerReason, recoveredAmount, waterfallTier）
- [x] 新增 **Collateral** 数据模型（type, value, status）
- [x] **GET /api/liquidation/:projectId/collateral** — 查询抵押物
- [x] **POST /api/liquidation/:projectId/collateral** — 添加抵押物
- [x] **GET /api/liquidation/:projectId/events** — 查询清算事件
- [x] **POST /api/liquidation/:projectId/trigger** — 触发清算（检测逾期 ≥3 期，扣押抵押物，失败项目）
- [x] 前端 API 方法（getCollateral, getLiquidationEvents）
- [ ] 瀑布分配具体算法（优先级：Senior → Unsecured → Equity）— 需业务决策
- [ ] 智能合约对接（链上抵押物管理）
- [ ] 前端清算管理 UI

---

## Phase 9: 治理系统 ✅

> PRD §11：DAO 投票 & 参数调整

- [x] 新增 **GovernanceProposal** 数据模型（category, forVotes, againstVotes, quorum, endsAt）
- [x] 新增 **GovernanceVote** 数据模型（vote, weight; @@unique([proposalId, userId])）
- [x] **GET /api/governance/proposals** — 提案列表
- [x] **POST /api/governance/proposals** — 创建提案（quorum = 10% 总持仓）
- [x] **POST /api/governance/proposals/:id/vote** — 投票（权重 = 用户总持仓，自动判定通过/拒绝）
- [x] 投票逻辑（投票权重 = 持仓份额）+ 治理参与信用加分
- [x] 前端 API 方法（getProposals, createProposal, voteOnProposal）
- [ ] 参数调整自动生效逻辑（等级阈值、费率等）— 需业务决策
- [ ] 国库再平衡算法
- [ ] 前端治理 UI 页面

---

## Phase 10: 用户设置 & KYC ✅（部分完成）

- [x] **Settings.tsx** — 对接用户信息修改接口（getUserProfile + updateProfile）
- [x] **Settings.tsx** — Profile 区域（可编辑显示名、邮箱、钱包展示）
- [ ] KYC 身份认证（投资者端）— 需第三方 KYC 服务
- [ ] 钱包绑定 / 助记词管理 — 需 Web3 钱包集成
- [ ] 通知偏好设置
- [ ] 语言切换（中/英）

---

## Phase 11: 前端体验优化 ✅（部分完成）

- [x] 全局 Toast 通知系统（Coming Soon toast + Swap/Trade 成功/错误提示）
- [x] 错误边界（ErrorBoundary 组件 + index.tsx 包裹）
- [ ] 移动端响应式适配完善
- [ ] 页面加载骨架屏（Skeleton）
- [ ] 路由系统升级（替换 Enum 为 React Router）
- [ ] 状态管理优化（Context / Zustand）
- [ ] 国际化 i18n（中英双语）

---

## Phase 12: 部署 & DevOps

- [ ] 生产环境数据库迁移（SQLite → PostgreSQL）
- [ ] 环境变量管理（.env.production）
- [ ] Docker 容器化
- [ ] CI/CD 流水线
- [ ] 日志系统（Winston / Pino）
- [ ] 监控告警（健康检查 + 错误追踪）
- [ ] HTTPS / 域名配置

---

## 统计

| 阶段 | 描述 | 状态 |
|------|------|------|
| Phase 0 | 基础设施 | ✅ 完成 |
| Phase 1 | 认证 & AI 聊天 | ✅ 完成 |
| Phase 2 | 前端对接真实 API | ✅ 完成 |
| Phase 3 | 投资核心流程 | ✅ 已完成 |
| Phase 4 | Swap / AIUSD | ✅ 后端 + 前端对接完成 |
| Phase 5 | Apply Flow & 企业认证 | ✅ 后端完成，前端 UI 待建 |
| Phase 6 | 信用评分系统 | ✅ 完成（服务+API+前端方法） |
| Phase 7 | 还款追踪 | ✅ 后端完成，cron 待配置 |
| Phase 8 | 清算机制 | ✅ 后端完成，合约待对接 |
| Phase 9 | 治理系统 | ✅ 后端完成，前端 UI 待建 |
| Phase 10 | 用户设置 & KYC | ✅ 基础完成，KYC 待接入 |
| Phase 11 | 前端体验优化 | ✅ ErrorBoundary + Toast 完成 |
| Phase 12 | 部署 & DevOps | ⬚ 待开始 |

> **当前状态**：Phase 0-11 后端 API 全部完成，前端核心页面已对接。剩余工作主要是前端 UI 建设和第三方服务集成。  
> **下一步**：Phase 5 前端 Apply UI → Phase 6 信用分展示 → Phase 9 治理 UI → Phase 12 部署
