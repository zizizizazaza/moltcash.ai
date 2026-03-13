# Loka Cash — 链上/链下架构 & 现金流资金管理

> **目的**：明确哪些功能上链、哪些走传统模式，以及现金流资产如何保证还款和资金安全

---

## 1. 链上 vs 链下 总览

```mermaid
graph TB
    subgraph ON_CHAIN["⛓️ 必须上链（Base 链）"]
        SWAP["代币 Swap<br/>ETH ⇄ USDC ⇄ DEGEN"]
        AIUSD["AIUSD 稳定币<br/>Mint / Redeem / Transfer"]
        SBT["SBT 身份凭证<br/>发行方认证"]
    end

    subgraph OFF_CHAIN["🏦 传统模式（链下）"]
        CF["现金流投资<br/>Stripe 支付 + 数据库"]
        REPAY["还款管理<br/>Stripe 自动分账"]
        KYC["KYC / 企业认证"]
        CREDIT["信用评分"]
        GOV["治理投票"]
    end

    subgraph HYBRID["🔄 混合模式"]
        PORT["Portfolio 余额<br/>链上代币 + 链下投资"]
    end

    style ON_CHAIN fill:#1a1a2e,color:#fff
    style OFF_CHAIN fill:#16213e,color:#fff
    style HYBRID fill:#0f3460,color:#fff
```

### 对比表

| 功能 | 模式 | 原因 | 技术方案 |
|------|:----:|------|---------|
| **代币 Swap** | ⛓️ 链上 | 本质是链上资产交换，必须调用 DEX 合约 | 0x / 1inch API + Privy 钱包签名 |
| **AIUSD 铸造/赎回** | ⛓️ 链上 | ERC-20 代币的 mint/burn 是链上操作 | AIUSD 合约 + USDC approve |
| **SBT 发行方认证** | ⛓️ 链上 | 不可转让的身份凭证，需链上不可篡改 | ERC-5192 (Soulbound) |
| **现金流投资** | 🏦 链下 | 传统金融投资，用法币/稳定币支付即可 | Stripe Connect + 数据库 |
| **还款 & 分账** | 🏦 链下 | 商家收入来自传统渠道（Stripe/银行） | Stripe Connect 自动分账 |
| **KYC / 企业认证** | 🏦 链下 | 身份验证是传统服务 | Sumsub / Onfido API |
| **信用评分** | 🏦 链下 | 内部评分系统，无需公开上链 | 后端 service + DB |
| **治理投票** | 🏦 链下 | 当前阶段链下足够，v2 可上链 | 后端 API + DB |
| **Portfolio 余额** | 🔄 混合 | 代币余额需链上查询，投资记录在链下 | ethers.js + DB |

> [!IMPORTANT]
> **结论**：只有 3 个功能 **必须** 上链 — 代币 Swap、AIUSD、SBT。
> 现金流投资的核心业务全部走传统金融模式，这大幅降低了上线复杂度。

---

## 2. 现金流资产 — 资金管理机制

### 2.1 核心问题

> 用户把钱投给商家，**怎么保证商家按时还钱？** 如果商家不还怎么办？

### 2.2 解决方案：Stripe Connect 自动分账 + 资金托管

```mermaid
sequenceDiagram
    participant Investor as 👤 投资者
    participant Loka as 🏛️ Loka 平台
    participant Stripe as 💳 Stripe Connect
    participant Merchant as 🏪 商家

    Note over Investor, Merchant: === 阶段 1：投资 ===
    Investor->>Loka: 投资 $1000 到商家项目
    Loka->>Stripe: 创建支付 → 资金进入 Loka 托管账户
    Stripe-->>Loka: 支付成功
    Loka->>Loka: 记录投资 (DB)
    Loka-->>Investor: 投资确认 ✅

    Note over Investor, Merchant: === 阶段 2：资金释放给商家 ===
    Loka->>Stripe: 项目达到目标，释放资金给商家
    Stripe->>Merchant: 转账到商家 Stripe 账户
    Note right of Merchant: 商家拿到资金开始经营

    Note over Investor, Merchant: === 阶段 3：自动还款（关键！）===
    Merchant->>Stripe: 商家日常收入通过 Stripe 收款
    Stripe->>Stripe: 🔒 自动拦截约定比例（如收入的 20%）
    Stripe->>Loka: 拦截金额自动转入 Loka 托管账户
    Loka->>Loka: 记录还款进度
    Loka->>Investor: 到期后支付本金 + 收益

    Note over Investor, Merchant: === 异常：商家逾期 ===
    Loka->>Loka: 定时任务检测逾期
    Loka->>Merchant: ⚠️ 逾期通知
    Loka->>Stripe: 🔒 提高拦截比例（如 40%）
    Loka->>Loka: 信用降级
```

### 2.3 关键机制详解

#### 🔒 机制 1：Stripe Connect 自动分账（Revenue Splitting）

> **核心思路**：商家通过 Stripe 收款时，平台自动从每笔收入中抽走约定比例用于还款。

**工作原理：**
- 商家接入 Stripe Connect 并授权 Loka 为其平台账户
- 商家的每笔收入，Stripe **自动** 按比例拆分：
  - 80% → 商家自己的账户
  - 20% → Loka 平台的托管账户（用于偿还投资者）
- 商家 **无法** 阻止这个分账，因为钱先经过 Stripe 再到商家

```
商家客户付款 $100
    ↓
Stripe 收到 $100
    ├── $80 → 商家账户
    └── $20 → Loka 托管账户 → 累积还款 → 到期支付给投资者
```

**Stripe API 实现：**
```javascript
// 创建 Connected Account（商家注册时）
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  capabilities: { transfers: { requested: true } },
});

// 商家收款时自动分账
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100
  currency: 'usd',
  application_fee_amount: 2000, // 平台抽取 $20（用于还款）
  transfer_data: {
    destination: merchantStripeAccountId,
  },
});
```

#### 🏦 机制 2：资金托管（Escrow）

| 阶段 | 资金位置 | 控制方 |
|------|---------|--------|
| 投资者付款 | Loka 平台 Stripe 账户 | Loka |
| 项目募资中 | Loka 托管账户（Stripe） | Loka |
| 项目达标 | 释放给商家 | 商家 |
| 商家还款中 | 从商家收入自动拦截 → Loka 托管 | Loka |
| 投资到期 | Loka 托管账户 → 投资者 | Loka → 投资者 |

> [!TIP]
> 关键点：**资金在整个生命周期内，大部分时间都在 Loka 控制的 Stripe 托管账户中**。
> 投资者的钱不是直接给商家，而是通过 Stripe 中间托管。

#### ⚡ 机制 3：收入验证 & 风控

```mermaid
graph TD
    A["商家申请项目"] --> B["收入验证"]
    B --> |"Stripe API"| C["自动获取近 12 个月收入数据"]
    B --> |"QuickBooks API"| D["自动获取财报数据"]
    C --> E["信用评分计算"]
    D --> E
    E --> |">= Tier 2"| F["✅ 允许上架"]
    E --> |"< Tier 2"| G["❌ 拒绝"]
    F --> H["设定还款条件"]
    H --> I["分账比例 / 期限 / 利率"]
```

**商家准入条件：**
- Stripe 连续 6+ 个月有稳定收入
- 月均收入 >= 还款金额的 3 倍
- 通过 KYC / UBO 检查
- 信用评分 Tier 2 及以上

#### 🛡️ 机制 4：违约保护（多层防御）

| 防御层 | 机制 | 说明 |
|--------|------|------|
| **第 1 层** | 收入自动拦截 | Stripe 自动从商家每笔收入中扣除还款，商家无法阻止 |
| **第 2 层** | 超额拦截 | 逾期后自动提高拦截比例（20% → 40%） |
| **第 3 层** | 信用降级 | 逾期降信用分 → 影响未来融资能力 |
| **第 4 层** | 保证金 | 商家预缴 5-10% 保证金，逾期时优先赔付 |
| **第 5 层** | 法律追索 | 投资合同有法律效力，可诉讼追偿 |
| **第 6 层** | 平台兜底基金（可选） | 平台从手续费中提取部分作为风险储备金 |

> [!WARNING]
> 如果商家完全停止使用 Stripe 收款（跑路），第 1-2 层失效。
> 此时需要第 4-6 层：保证金赔付 + 法律追索 + 平台兜底。
> **这是最大风险点**，需要法律合同 + 保证金机制双重保障。

---

## 3. 投资生命周期

```mermaid
stateDiagram-v2
    [*] --> Fundraising: 项目上架
    Fundraising --> Funded: 达到目标金额
    Fundraising --> Failed: 超期未达标
    Failed --> [*]: 全额退款给投资者

    Funded --> Active: 资金释放给商家
    Active --> Repaying: 商家开始还款
    Repaying --> Completed: 全部还清
    Repaying --> Overdue: 逾期 >30 天
    Overdue --> Repaying: 补缴还款
    Overdue --> Defaulted: 逾期 >90 天
    Defaulted --> Liquidating: 触发清算
    Liquidating --> [*]: 保证金赔付 + 法律追索

    Completed --> [*]: 投资者收回本金+收益 🎉
```

### 各阶段资金流向

| 阶段 | 投资者 → | → 平台 | → 商家 | 说明 |
|------|:--------:|:------:|:------:|------|
| **募资中** | $1000 出 | $1000 进（托管） | $0 | 钱在平台托管 |
| **达标释放** | — | $1000 出 | $1000 进 | 释放给商家使用 |
| **还款中** | — | 每月自动收 | 每月被扣 | Stripe 自动分账 |
| **到期结算** | $1185 进 | $1185 出 | — | 本金$1000 + 收益$185 |
| **违约清算** | 保证金赔付 | 扣商家保证金 | 黑名单 | 第 4-6 层启动 |

---

## 4. 技术实现清单

### 4.1 必须上链的（3 项）

| 功能 | 合约类型 | 难度 | 说明 |
|------|---------|:----:|------|
| 代币 Swap | 不需自己写，调用 DEX | 🟡 中 | 集成 0x/1inch API |
| AIUSD | ERC-20 + Mint/Burn 权限 | 🟡 中 | 标准 ERC-20 + owner mint |
| SBT | ERC-5192 Soulbound | 🟢 低 | 简单的不可转让 NFT |

### 4.2 传统模式的（核心业务）

| 功能 | 技术方案 | 当前状态 | 差距 |
|------|---------|:--------:|------|
| 投资支付 | Stripe Checkout | ❌ 未对接 | 需申请 Stripe Connect |
| 自动分账 | Stripe Connect 分账 | ❌ 未对接 | 核心功能，需开发 |
| 资金托管 | Stripe 平台账户 | ❌ 未对接 | Stripe 自带 |
| 收入验证 | Stripe API 读取商家数据 | ❌ 未对接 | 需 OAuth 授权 |
| 还款追踪 | 后端定时任务 | ✅ 已完成 | DB 逻辑已有 |
| 逾期检测 | 后端定时任务 | ✅ 已完成 | 自动检测 |
| 信用评分 | 后端 service | ✅ 已完成 | 3 级体系 |
| 清算算法 | 后端 service | ✅ 已完成 | 瀑布分配 |

### 4.3 优先级排序

```mermaid
graph LR
    P0["🔴 P0: Stripe Connect<br/>投资支付 + 自动分账"] --> P1["🟡 P1: 收入验证<br/>商家准入"]
    P1 --> P2["🟡 P1: 0x API<br/>代币 Swap"]
    P2 --> P3["🟢 P2: AIUSD 合约<br/>稳定币"]
    P3 --> P4["🟢 P2: SBT 合约<br/>身份认证"]

    style P0 fill:#fee,stroke:#c00
    style P1 fill:#ffd,stroke:#aa0
    style P2 fill:#ffd,stroke:#aa0
    style P3 fill:#dfd,stroke:#0a0
    style P4 fill:#dfd,stroke:#0a0
```

---

## 5. AIUSD 稳定币 — 技术落地方案


### 5.1 产品定位

**AIUSD = 国债支持的支付型稳定币**

- 用户存入 USDT/USDC → 协议用 85% 购买链上国债 → 1:1 铸造 AIUSD
- 用户 **不享有** 国债利息 → 利息归协议（核心收入来源）
- 赎回时 1:1 销毁 AIUSD → 返还 USDT/USDC

```mermaid
graph LR
    User["👤 用户"] -->|"存入 1000 USDC"| Contract["📜 AIUSD 合约"]
    Contract -->|"850 USDC"| Treasury["🏦 国债购买<br/>(OUSG/STBT)"]
    Contract -->|"100 USDC"| Reserve["💰 赎回备用金"]
    Contract -->|"50 USDC"| Ops["⚙️ 运营储备"]
    Contract -->|"铸造 1000 AIUSD"| User

    Treasury -->|"年化 4-5% 利息"| Protocol["🏛️ 协议收入"]

    style Contract fill:#1a1a2e,color:#fff
    style Treasury fill:#16213e,color:#fff
    style Protocol fill:#0f3460,color:#fff
```

### 5.2 资金分配模型

| 资金去向 | 比例 | 用途 |
|---------|:----:|------|
| 链上国债代币 | 85% | 购买 OUSG (Ondo) / STBT (Matrixdock) 等短期美债 ETF |
| 赎回备用金 | 10% | 热钱包，覆盖日常小额赎回 |
| 运营储备 | 5% | Gas 费、应急流动性 |

### 5.3 铸造与赎回流程

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant UI as 🖥️ 前端
    participant Contract as 📜 AIUSD 合约
    participant Treasury as 🏦 国债管理

    Note over User, Treasury: === 铸造 AIUSD ===
    User->>UI: 输入 1000 USDC
    UI->>Contract: approve(1000 USDC) + mint()
    Contract->>Contract: 收到 USDC，验证金额
    Contract->>Contract: 铸造 999 AIUSD（扣 0.1% 铸币费）
    Contract->>User: 发送 999 AIUSD
    Contract->>Treasury: 850 USDC → 购买 OUSG
    Contract->>Contract: 100 USDC → 备用金池
    Note right of Contract: 50 USDC → 运营储备

    Note over User, Treasury: === 赎回 USDC ===
    User->>UI: 赎回 500 AIUSD
    UI->>Contract: redeem(500 AIUSD)
    Contract->>Contract: 判断赎回类型
    alt 小额赎回（≤备用金 10%）
        Contract->>User: T+0 即时返还 499.75 USDC
    else 大额赎回（>备用金 10%）
        Contract->>Contract: 进入队列，T+7 天
        Contract->>Treasury: 卖出部分国债补充备用金
        Contract->>User: 7 天后返还 USDC
    end
```

### 5.4 赎回分层机制

| 赎回类型 | 条件 | 到账时间 | 费用 |
|---------|------|:--------:|:----:|
| 小额即时赎回 | ≤ 备用金 10% | T+0 即时 | 0.05% |
| 普通赎回 | ≤ 备用金 50% | T+0 ~ T+1 | 0.05% |
| 大额赎回 | > 备用金 50% | T+7 天 | 0（无额外费用） |
| 超大额赎回 | > 备用金 80% | T+7 分 3 期 | 0 |

> [!WARNING]
> **赎回挤兑防护**：当备用金 < 20% 时，自动触发大额赎回延迟。
> 同时协议从国债端快速变现补充备用金。

### 5.5 国债购买策略

**选型对比**：

| 标的 | 发行方 | 底层资产 | 年化 | 赎回 | 适合 |
|------|--------|---------|:----:|:----:|------|
| **OUSG** | Ondo Finance | 短期美债 ETF (SHV) | ~5% | T+1 | ✅ 首选 |
| **STBT** | Matrixdock | 6 月内美债 | ~4.8% | T+2 | ✅ 分散 |
| **USDY** | Ondo Finance | 国债+活期存款 | ~5.2% | T+1 | 备选 |
| **BUIDL** | BlackRock | 美债基金 | ~4.5% | T+0 | 机构级 |

**风控规则**：
- 单一标的持仓 ≤ 30%（分散风险）
- 仅购买 1-3 个月期短期国债（确保流动性）
- 最低抵押率 120%（国债市值 / AIUSD 发行量）
- 抵押率 < 110% → 自动卖出国债补充备用金
- 抵押率 < 105% → 熔断，暂停铸造

### 5.6 收入模型

> [!NOTE]
> AIUSD 的核心商业模式：**用户 0 利息持有，协议吃全部国债利差**

| 收入来源 | 计算方式 | 占比 |
|---------|---------|:----:|
| 国债利息 | TVL × 5% 年化 × 85%（国债占比） | ~90% |
| 铸币费 | 铸造金额 × 0.1% | ~8% |
| 赎回费 | 赎回金额 × 0.05% | ~2% |

**收入估算（按 TVL）**：

| TVL | 国债利息/年 | 铸币费/年 | 总收入/年 |
|:---:|:----------:|:--------:|:--------:|
| $1M | $42,500 | $5,000 | ~$47,500 |
| $10M | $425,000 | $50,000 | ~$475,000 |
| $100M | $4,250,000 | $500,000 | ~$4,750,000 |

### 5.7 智能合约架构

```mermaid
graph TB
    subgraph CONTRACTS["📜 AIUSD 合约体系"]
        AIUSD_TOKEN["AIUSD Token<br/>(ERC-20)"]
        VAULT["Vault 合约<br/>(铸造/赎回/备用金)"]
        TREASURY["Treasury 合约<br/>(国债购买/卖出)"]
        ORACLE["价格预言机<br/>(Chainlink)"]
    end

    USER["👤 用户"] -->|"USDC approve + mint"| VAULT
    VAULT -->|"铸造"| AIUSD_TOKEN
    VAULT -->|"85% USDC"| TREASURY
    TREASURY -->|"购买 OUSG/STBT"| DEX["国债 DEX"]
    ORACLE -->|"国债价格"| VAULT
    VAULT -->|"抵押率检查"| ORACLE

    style CONTRACTS fill:#1a1a2e,color:#fff
```

**合约清单**：

| 合约 | 职责 | 标准 | 复杂度 |
|------|------|------|:------:|
| `AIUSD.sol` | ERC-20 代币，仅 Vault 可 mint/burn | ERC-20 + AccessControl | 🟢 低 |
| `AIUSDVault.sol` | 铸造/赎回逻辑，备用金管理，赎回队列 | 自定义 | 🟡 中 |
| `Treasury.sol` | 国债代币购买/卖出，抵押率监控 | 自定义 | 🟡 中 |
| `RedemptionQueue.sol` | 大额赎回排队，T+7 兑付 | 自定义 | 🟡 中 |

### 5.8 前端页面（已有 UI，需对接合约）

| 页面 | 当前状态 | 需要对接 |
|------|:--------:|---------|
| 铸造页面 (Deposit) | ✅ UI 完成 | 合约 approve + mint |
| 赎回页面 | ✅ UI 完成 | 合约 redeem + 队列展示 |
| 储备金仪表盘 | ❌ 未实现 | 合约读取抵押率/备用金/国债持仓 |
| 赎回队列展示 | ❌ 未实现 | 大额赎回排队状态 |

### 5.9 AIUSD 开发路线图

```mermaid
gantt
    title AIUSD 开发路线
    dateFormat  YYYY-MM-DD
    section 合约开发
    AIUSD ERC-20 合约        :a1, 2026-04-01, 3d
    Vault 铸造/赎回合约       :a2, after a1, 5d
    Treasury 国债管理合约      :a3, after a2, 5d
    赎回队列合约              :a4, after a3, 3d
    section 测试
    Testnet 部署 & 测试       :b1, after a4, 5d
    安全审计                  :b2, after b1, 14d
    section 前端对接
    Deposit 页面对接合约       :c1, after a4, 3d
    储备金仪表盘              :c2, after c1, 3d
    section 上线
    Mainnet 部署             :milestone, after b2, 0d
```

### 5.10 AIUSD 技术待办

| 事项 | 负责 | 优先级 | 依赖 |
|------|:----:|:------:|------|
| AIUSD ERC-20 合约编写 | AI + 合约开发 | 🟡 P1 | — |
| Vault 合约（铸造/赎回/备用金） | AI + 合约开发 | 🟡 P1 | AIUSD 合约 |
| Treasury 合约（国债购买） | AI + 合约开发 | 🟡 P1 | Vault 合约 |
| 对接 Ondo Finance OUSG API | AI | 🟡 P1 | Treasury 合约 |
| Chainlink 价格预言机集成 | AI | 🟡 P1 | — |
| Testnet 部署 + 测试 | AI | 🟡 P1 | 合约完成 |
| 前端 Deposit 页面对接 | AI | 🟡 P1 | Testnet |
| 储备金仪表盘前端 | AI | 🟢 P2 | Testnet |
| 合约安全审计 | 👤 | 🔴 P0 | 合约完成 |
| Mainnet 部署 | 👤 + AI | 🔴 P0 | 审计通过 |
| 法律声明（非理财产品免责） | 👤 | 🔴 P0 | — |

> [!IMPORTANT]
> **用户无利息声明**：必须在 UI 醒目位置展示：
> "AIUSD 是支付型稳定币，100% 由美国国债支持。持有 AIUSD 不产生利息，底层国债全部利息归 LOKA 协议所有，作为提供稳定币服务的对价。"

---

## 6. 总结

> [!NOTE]
> **核心发现**：Loka Cash 的主营业务（现金流投资）**完全不需要链上合约**。
> 通过 Stripe Connect 就能实现：投资支付、资金托管、自动还款、收入拦截。
> 
> 链上部分（Swap / AIUSD / SBT）是增值功能，可以分阶段上线：
> - **Phase 1（MVP）**：现金流投资（Stripe） + AI Chat
> - **Phase 2**：AIUSD 稳定币（国债支持）
> - **Phase 3**：代币 Swap + SBT + PT/YT 结构化产品

**MVP 上线只需要：**
1. ✅ 已有：后端投资/还款/信用评分逻辑
2. 🔴 需要：Stripe Connect 对接（支付 + 分账 + 托管）
3. 🔴 需要：部署 + 域名
4. 🟡 Phase 2：AIUSD 合约 + 国债对接
5. 🟡 Phase 3：代币 Swap + PT/YT

**你需要做的：**
1. 申请 Stripe Connect 平台账号
2. 准备真实的商家项目
3. 法律合同模板（投资协议 + 还款承诺 + AIUSD 免责声明）
4. 提供服务器 + 域名
5. 对接 Ondo Finance（OUSG 购买渠道）
6. 合约审计预算
