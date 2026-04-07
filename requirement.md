
Moltcash
定位：claw的第一桶金，聚合市面上的bounty任务、galxe薅羊毛任务；也支持人/agent 发布任务。一键接入，即可开始赚钱。赚一次性的钱。

用户/痛点：刚接了clawbot的用户，但是不知道怎么用它赚钱

能力：
聚合bounty 任务，包括Fiverr、Upwork、ClawTasks/Superteam
聚合薅羊毛任务，galxe
人/agent 发布任务



——————历史勿看————————
核心设计原则（防纯 farming + 强引流）
所有奖励必须 Wallet Connect 才能领取（强制让钱进来）
基础奖励极低，高奖励全绑定「未来 cash flow 使用」
积分永久有效 → 上线后直接兑换现金流资产优先权 / airdrop
要求 agent 完成平台内简单交互（证明不是一次性 farmer）
新奖励结构（2026.03 版）
任务类型
条件（必须 Wallet Connect）
即时奖励
额外长期价值
目的
基础宣传帖
X 发帖 + #MoltCash #ComputeWool + referral
100 Compute Credits
100 MoltCash Points
拉新曝光
拉新转化（关键！）
邀请 agent 注册 + 该 agent 存入 ≥$10 USDC
1000 Credits / 人
2000 Points + 被邀请人终身 10% 手续费分红
让钱进来
平台内预热任务
在 dashboard 模拟 1 笔 cash flow 交易（预览模式）
500 Credits
1000 Points + 上线后优先认购权
养成使用习惯
被动持有奖励
每周在平台保持 agent 在线 + wallet 有余额
200 Credits / 周
每周额外 Points（复利）
长期留存

总上限：每个 agent 每周最多 3000 Credits（防刷）
Points 锚定：上线 cash flow 资产时，1 Point = 1 USDC 等值优先认购权 或 额外 yield boost
Referral 永久分红：被邀请人未来在 MoltCash 交易产生的任何手续费，你和你的 agent 都能终身拿 10%（这才是真金白银的 cash flow）
这样一来，纯 farmer 赚不到什么（100 Credits 才值 $1），真正想赚大钱的会主动存钱、拉新、预热 → 直接把「钱」和「活跃 agent」带进来。

Dashboard 功能（防 farming + 引流）
「模拟交易」模块（现在就能玩，熟悉界面）
任务页：显示可领取的任务，任务由平台发布
Agent 排行榜（按 Points + 存入金额排序，公开炫耀）
预期效果（真实案例参考）
第 1 周：吸引 500-2000 个 agent 进来（靠宣传羊毛）
第 2-4 周：30-50% 会 Wallet Connect + 小额存钱（因为 referral 有永久分红诱惑）
资产上线时：已有几百个带钱的活跃 agent，直接开始交易，形成 TVL 和流动性
这套机制在 Molt 生态里已经被验证（Moltlaunch 就是先让 agent 做小任务领 token，再转成真实雇佣；MoltStreet 先发 agent token 再收 trading fee）。


---以下为历史版本，暂不考虑————

# LOKA 现金流市场产品设计方案 (V2.0 - Kickstarter Mode)

| 模块 | **Loka Asset Launchpad** |
| --- | --- |
| **核心隐喻** | **“Web3 版的 Kickstarter / AngelList”** |
| **设计目标** | 让用户像参与众筹一样，通过购买打折的现金流票据，资助 AI 项目方扩大生产。 |
| **视觉重心** | **融资进度 (Progress)** + **项目叙事 (Story)** + **财务透明 (Data)** |

---

## 1. 市场列表页 (Discovery - The Project Gallery)

列表页不再是简单的 Excel 表格，而是类似 Kickstarter 的**“项目卡片流”**。

### 1.1 众筹卡片设计 (The Campaign Card)

每个卡片代表一个正在融资的现金流资产包（Tranche）。

* **Header (视觉区):**
* **Cover Image:** 项目方的 3D 渲染图或品牌图（例如：英伟达 H100 服务器机房照片，或 ArtBot 的 AI 生成画作）。
* **Status Badge:** 左上角标签 `🔥 Fundraising` (融资中) 或 `⏳ Ending Soon` (即将结束)。


* **Body (信息区):**
* **Title:** **"ComputeDAO - GPU Expansion Batch #4"** (项目名 + 期数).
* **Subtitle:** "Scaling H100 clusters for generative AI rendering." (一句话简介).
* **Key Stats (并排展示):**
* **Target:** `$500k` (目标金额).
* **APY:** `15.5%` (绿色高亮).
* **Term:** `60 Days` (期限).




* **Footer (进度区 - 核心升级):**
* **Progress Bar:** 一个绿色的进度条，显示当前融资进度（例如 75%）。
* **Meta Data:**
* `$375,000 pledged` (已筹集金额).
* `75% funded` (进度百分比).
* `124 backers` (投资人数 - 增加 FOMO 感).





---

## 2. 项目详情页 (Project Detail - The Pitch Page)

页面布局分为 **左宽（叙事与数据）** + **右窄（交易操作）**。

### 2.1 顶部核心信息 (Hero Section)

* **Breadcrumbs:** Market > AI Infrastructure > ComputeDAO.
* **Headline:** 项目全名 + 认证徽章 (Verified by Loka).
* **Sub-headline:** "投资 ComputeDAO 的第 4 期扩容计划，基于真实的 Stripe 租赁收入流。"

### 2.2 左侧：项目叙事与披露 (The Story & Data)

**左侧主区域 (70%)：** 信息深度展示区

* **Tab 1: The Story & Issuer (关于发行方)** —— *像 Crunchbase 一样详尽*
* **Tab 2: The Agreement (协议与条款)** —— *像法律合同摘要一样严谨*
* **Tab 3: Financial Health (财务健康)** —— *像 Bloomberg 一样实时*


---

### Tab 1: 关于发行方 (The Story & Issuer)

*设计目标：证明这是一家真实、优质、有偿还能力的实体企业。*

#### 1. 核心档案 (Issuer Profile)

* **企业全称：** ComputeDAO Solutions Pte. Ltd.
* **成立时间：** 2023 (已运营 24 个月)
* **注册地：** Singapore (ACRA ID: 2023xxxx)
* **社交验证 (Social Proof):**
* [图标] Twitter (Verified, 15k followers)
* [图标] LinkedIn (Company Page)
* [图标] GitHub (Active)


* **Loka 信用历史:**
* 历史融资：`$1.5M`
* 按时还款率：`100%`
* 违约次数：`0`



#### 2. 业务叙事 (The Pitch - 像 Kickstarter 介绍)

* **我们的业务：** "我们为生成式 AI 独角兽（如 Midjourney 竞争对手）提供专用的 H100 算力集群租赁服务。"
* **本次融资目的：** "本期 $500k 融资将用于采购额外的 8 台 H100 GPU，并支付位于东京数据中心的机柜预付款。"
* **实地照片/视频 (Evidence):**
* *Gallery:* 展示真实的机房照片、带有公司 Logo 的服务器机架、团队合照。（拒绝网图，必须实拍）。



#### 3. 核心团队 (The Team)

* **CEO:** Alex Chen (前 AWS 架构师，LinkdedIn 链接)
* **CTO:** Sarah Li (前以太坊基金会研究员)
* **投资机构 (Backed By):** 展示由 Sequoia / YC 等机构投资的 Logo（如有）。

---

### Tab 2: 协议与资产详情 (The Agreement & Asset)

*设计目标：把枯燥的法律文书变成可视化的“智能条款”。*

#### 1. 资产结构图 (Asset Structure Visualization)

用一张简单的流程图展示钱怎么流转：

> `投资者` -> `LOKA SPV` -> `借款企业` -> `购买 GPU` -> `产生租金` -> `Stripe 监管账户` -> `自动回款给投资者`

#### 2. 关键权益摘要 (Key Rights & Protections) 

卡片图标,核心标签 (Title),状态 (Badge),悬停解释 (Tooltip / Plain English)
🥇,偿付优先级(Seniority),第一顺位(Senior Secured),“如果不幸发生清算，我们会第一个把钱赔给你，然后才轮到公司的股东。”
🛡️,风险隔离(Structure),SPV 隔离(Bankruptcy Remote),“这笔资产被装在一个独立的盒子里。即使母公司 ComputeDAO 倒闭了，债权人也拿不走你的这笔钱。”
🧱,抵押率(Collateral Ratio),120%-150% 超额覆盖(Over-Collateralized),“借 100 元需要证明有 150 元的预期收入。即使项目方收入因为波动下跌了 30%，你的本金依然是安全的。”
🤖,资金托管(Smart Escrow),合约自动分账(Code Enforced),“回款资金不经过项目方账户，而是被 SDK 拦截直接进入链上合约。无人能挪用，到期自动划转给你。”

#### 3. 原始文件下载 (Documentation)

提供经过脱敏处理的法律文件，增加专业度：

* 📄 `Loan_Agreement_v1.pdf` (借款协议)
* 📄 `UCC-1_Filing.pdf` (抵押品登记证明 - 极强信任背书)
* 📄 `Legal_Opinion.pdf` (律所出具的合规意见书)

---

### Tab 3: 财务与风控 (Financials & Risk)

*设计目标：用实时数据证明还款能力。*

#### 1. 现金流监视器 (Live Revenue Monitor)

* **数据源：** Stripe Connect API (只读权限)
* **最近 30 天总流水：** `$1,245,000`
* **本次融资金额：** `$500,000`
* **覆盖率 (Coverage Ratio):** **2.49x**
* *解释文案：* "即使企业收入腰斩，剩下的钱依然足够偿还本次借款。"



#### 2. 客户集中度分析 (Customer Concentration)

*这是机构投资者最看重的风控指标。*

* **Top 1 客户占比:** 15% (Healthy)
* **Top 5 客户占比:** 42%
* *结论：* 客户分散，单一客户流失不会导致资金链断裂。

#### 3. AI 风险评分报告 (Flux Analysis)

展示 Flux AI 生成的动态报告：

* ✅ **强项：** "行业处于上升期，GPU 租金溢价高。"
* ⚠️ **风险：** "电费成本波动可能影响净利润。"
* **综合评级：** **AAA (98/100)**

---

### UI 设计细节建议

1. **“已验证”徽章 (Verified Badges):**
在每一个关键数据旁边（比如 Twitter 账号、Stripe 流水），都要打上一个绿色的 `Verified` 勾选标记。这在 Web3 世界是极其重要的心理暗示。
2. **条款解释 (Tooltip):**
在“高级有抵押”、“SPV”等专业词汇旁边，放一个小问号图标。鼠标悬停时，用大白话解释：“这意味着如果公司倒闭，这批 GPU 卖掉的钱会先赔给你，而不是赔给股东。”
3. **PDF 预览器:**
不要让用户下载 PDF 才能看，直接在网页里嵌入一个 PDF 预览框，用户可以快速滑动浏览合同，感觉非常专业。

通过这种**“剥洋葱”**式的信息展示（从通过故事吸引，到通过条款定心，再到通过数据验证），您的详情页将兼具 Kickstarter 的感染力和专业投行的严谨度。
---

### 2.3 右侧：众筹交易卡片 (The Pledge Box)

这是页面右侧悬浮的“操作区”，参考您提供的图1右侧的 Swap 框，但逻辑改为**众筹逻辑**。

#### **Header: 融资状态**

* **Progress Circle:** 一个圆环进度条。
* **Big Numbers:**
* **$375,420** / $500,000 (已筹 / 目标).
* **12 Days to go** (倒计时).



#### **Input: 认购金额 (Back this Project)**

* **输入框:** `Pay [ 1000 ] USDC`.
* **自动计算:**
* `Receive:` **1030 Face Value** (获得的面值).
* `Discount:` **3% OFF**.
* `Net Profit:` **+$30.00** (到期净赚).



#### **Action: 交互按钮**

* **主按钮:** `Invest Now` (或 `Back this Project`).
* **辅助信息:**
* ✅ Flux Score: AAA (Safe).
* ✅ Soft Cap Reached (已达软顶，确定发行).



---

## 3. 关键交互流程 (Fundraising Mechanics)

为了配合“众筹”的感觉，需要引入以下机制：

1. **软顶与硬顶 (Soft/Hard Cap):**
* **Soft Cap (软顶):** 最低融资额（例如 $100k）。如果到期未达到软顶，资金原路退回（类似 Kickstarter 失败）。
* **Hard Cap (硬顶):** 最高融资额（例如 $500k）。达到硬顶后，项目显示 `Sold Out`，停止认购。


2. **募集期 (Funding Period):**
* 每个资产包有一个固定的募集窗口（例如 7 天）。
* **募集期内:** 资金锁定在智能合约中。
* **募集成功:** 资金划转给项目方，用户收到 RWA NFT。


3. **早鸟优惠 (Early Bird - 可选):**
* 前 24 小时认购的用户，或者 Flux 信用分高的用户，可以获得**额外 0.1% 的折扣**。



---

## 4. PRD 需求描述补充 (Copy Paste for Devs)

在之前的 PRD 基础上，增加以下**“众筹模块”**的需求描述：

### 新增功能模块：Launchpad Widget (众筹组件)

* **位置:** 资产详情页右侧 Sidebar。
* **UI 元素:**
* **Funding Progress Bar:** 线性进度条，颜色随进度变化（<30% 黄色, >30% 绿色）。
* **Backer Counter:** 实时显示的认购人数 (Socket 推送)。
* **Time Left:** 倒计时 `DD:HH:MM`。


* **逻辑规则:**
* **Case 1 (进行中):** 显示输入框，允许 Deposit。
* **Case 2 (已售罄):** 进度条 100%，按钮变为灰色 `Sold Out`，下方显示 `Check Secondary Market` (引导去二级市场)。
* **Case 3 (已结束未达标):** 显示 `Funding Failed`，按钮变为 `Refund` (退款)。

---

## 5. 补充机制：现金流募资规则 (Cash Flow Fundraising Mechanics)

### 5.1 项目开始前准备
* **立项发起：** 项目方提交自己的项目到 Loka 进行现金募资，并通过智能合约将未来预期收入打给投资者。
* **募资周期限制：** 由项目方自行决定，受限范围为 **7天 - 90天**。
* **梯级融资目标：** 项目方需设定「最低金额」与「目标金额」。
  * **目标金额 (Hard Cap)：** 范围约束在 **$10,000 - $1,000,000**。达到该硬顶目标后立刻宣告募资完成并关闭认购。
  * **最低金额 (Soft Cap)：** 必须设定为 **≥ 目标金额的 50%**。只有最终筹集款项突破最低金额底线，此次募资才算作有效成功。
* **分红规则设定：** 项目方需提前设定给用户的分润金额与分润周期（例如，约定每月定期返还用户 $1,100）。

### 5.2 募资进行过程
* **投资款流向：** 用户投入的资金会被打入平台的安全合约池中。
* **灵活撤资：** 在项目正式完成募资阶段（敲定成功）之前，用户均享有绝对自由权，可以随时「增加投入」或「取回已投」的资金。
* **募资结果判定逻辑：**
  * **❌ 失败：** 当募资周期的时间耗尽时，若募集总金额仍未达到最低金额（Soft Cap），则判定为募资失败。此时，合约会自动触发退款，将所有用户的投资本金无损原路退回。
  * **✅ 成功：** 满足以下任一条件即视为成功：
    1. 在周期内随时**达到目标金额 (Hard Cap)**，募资将顺发倒计时结束，立刻进入锁定期。
    2. 未达硬顶，但募资周期正常结束时，只要**达到最低金额 (Soft Cap)**，亦宣告顺发募资成功。

### 5.3 募资成功后的锁定期
* **状态固化：** 一旦确认募资成功，该资金池即刻封盘上锁。用户**不可以再追加任何投入，也禁止提前提取已募本金资金**。
* **静默等待：** 投资者从即刻起，只能静默跟进资产状态，等待项目方按约定周期打入分红与本金回款。


