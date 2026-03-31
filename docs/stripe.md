
文档基于 Stripe 官方机制 + TrustMRR 实际实现方式（用户提供 **restricted API key**，平台定时拉取并计算 MRR），力求清晰、可落地。

### 项目名称建议
**收入验证平台（Revenue Verification Platform）**  
核心功能：用户提供只读支付平台 API Key → 平台定时验证并公开显示真实 MRR、总收入、增长率等指标。

### 1. 整体架构概述
- **用户流程**（极简）：
  1. 用户在自己的 Stripe Dashboard 创建 **Restricted API Key**（只读权限）。
  2. 在你的平台「添加项目」页面粘贴该 Key。
  3. 平台验证 Key 有效性 → 加密存储 → 开始定时同步数据。
  4. 数据每小时（或每 30 分钟）更新一次，计算 MRR 并展示在公开页面。

- **后端核心组件**：
  - API Key 提交与验证模块
  - 加密存储模块（必须使用 KMS / Vault）
  - 定时同步任务（Cron / Queue）
  - MRR 计算引擎
  - 公开展示页面 + SEO 友好链接

- **不推荐**：使用 Stripe Connect（OAuth），因为会增加用户操作步骤和后端复杂度。除非你需要代收款、平台抽成等高级功能。

### 2. Stripe Restricted API Key（推荐实现方式）
用户无需跳转授权，只需手动创建并粘贴。

**用户创建步骤（你需要在前端提供详细图文教程）**：
1. 登录 Stripe Dashboard → Developers → API keys。
2. 点击 **Create restricted key**。
3. 输入 Key 名称，例如：`YourPlatformName Revenue Verification`。
4. 设置以下 **Read** 权限（其他全部设为 None）：
   - **Charges** → Read（用于收入计算）
   - **Subscriptions** → Read（核心，用于 MRR 计算）
   - **Customers** → Read（可选，辅助用户/订阅信息）
   - **Invoices** → Read（推荐，用于处理折扣、proration）
   - **Balance** → Read（可选）
   - **Balance Transactions** → Read（可选，用于更精确的收入确认）
   - **Prices** / **Products** → Read（推荐，用于显示产品名称）

5. 点击 Create → 复制以 `rk_live_` 开头的密钥（测试环境为 `rk_test_`）。

**前端实现建议**：
- 一个大输入框 + “粘贴 Restricted API Key” 提示。
- 实时校验：必须以 `rk_` 开头。
- 提供一步步截图或视频引导（强烈推荐）。
- 可选：同时支持其他平台（LemonSqueezy、Paddle、RevenueCat 等），它们也有类似 scoped/read-only key。

### 3. 后端实现细节

#### 3.1 提交与初始验证
```python
# 示例：Python + Stripe SDK
import stripe
from your_app.utils.encryption import encrypt_key  # 使用 AES + KMS

async def submit_stripe_key(startup_id: str, raw_key: str):
    if not raw_key.startswith('rk_'):
        raise ValueError("必须是 Restricted API Key (rk_ 开头)")

    # 测试密钥有效性（只读操作）
    stripe.api_key = raw_key
    try:
        # 简单测试调用
        account = stripe.Account.retrieve()
        # 或 stripe.Subscription.list(limit=1)
        # 或 stripe.Charge.list(limit=1)
    except stripe.error.AuthenticationError:
        raise ValueError("密钥无效或权限不足")
    except Exception as e:
        # 记录但不暴露详细错误
        raise ValueError("密钥验证失败，请检查权限")

    # 加密存储（绝不明文存储！）
    encrypted = encrypt_key(raw_key)
    db.save_connection({
        "startup_id": startup_id,
        "provider": "stripe",
        "encrypted_key": encrypted,
        "status": "active",
        "last_synced_at": None
    })
```

**安全要求**：
- 使用硬件安全模块（HSM）或云 KMS（AWS KMS、Google Cloud KMS、HashiCorp Vault）加密。
- 密钥仅在同步任务的内存中使用，绝不记录到日志。
- 支持用户随时撤销（删除连接记录 + 建议用户在 Stripe 删除该 Key）。

#### 3.2 定时同步任务（推荐每小时执行）
使用 Celery / RQ / Kubernetes CronJob 等。

```python
async def sync_startup_revenue(connection):
    stripe.api_key = decrypt(connection.encrypted_key)  # 仅本次任务使用

    # 分页拉取数据（注意 rate limit）
    subscriptions = stripe.Subscription.list(
        status=["active", "past_due"],
        limit=100,
        expand=["data.customer", "data.plan"]
    )
    
    # 可额外拉取最近发票/charges 处理边缘情况
    charges = stripe.Charge.list(created={"gte": thirty_days_ago}, limit=100)

    metrics = calculate_metrics(subscriptions, charges)
    
    db.update_startup_metrics(connection.startup_id, metrics)
```

#### 3.3 MRR 计算逻辑（核心难点）
Stripe 没有直接给出 MRR 接口，需要自行计算。

**推荐基础公式**（参考 Stripe 官方建议）：
- **MRR** = 所有 **active** + **past_due** 订阅的 **月化金额** 总和
- 对于年付订阅：`amount / 12`
- 处理事项：
  - 折扣（coupon / subscription discount）
  - Trial（通常不计入 MRR，除非已付费）
  - Proration / Upgrade / Downgrade
  - 多币种（建议统一转 USD 或显示原币种）
  - Churn / Cancellation（已取消但还有剩余周期的可按比例计）

**建议实现**：
- 先用 **Subscriptions** 计算当前 MRR（简单快速）。
- 结合 **Invoices** 做更精确的历史/最近30天收入。
- 处理常见边缘：免费试用、metered billing、one-time charges 等。
- 输出字段示例：`mrr`, `arr`, `total_revenue`, `revenue_last_30d`, `growth_rate_mom`, `active_subscriptions_count`, `updated_at`

你可以参考开源 MRR 计算库或 Medium 上的 Stripe MRR 计算文章进行实现。

### 4. 支持其他支付平台（可选扩展）
TrustMRR 当前支持：**Stripe、LemonSqueezy、Polar、Paddle、RevenueCat、Superwall、Creem、DodoPayment** 等。

每个平台都有自己的 read-only / scoped key 机制，处理方式类似：
- 验证 Key 格式 + 测试 API 调用
- 加密存储
- 针对性拉取订阅/收入数据
- 统一计算 MRR（不同平台字段不同，需要适配层）

建议先只做 **Stripe**，稳定后再扩展。

### 5. 安全与合规要点
- **最小权限原则**：明确告诉用户我们只用 Read 权限。
- **数据隐私**：只拉取必要指标，不存储原始客户列表（除非必要）。
- **Terms of Service**：必须写清楚“我们只接受 read-only key，不会修改你的账户”。
- **密钥轮换**：支持用户更新 Key。
- **审计日志**：记录同步时间、成功/失败，不记录密钥内容。
- 如果未来加 KYB（企业认证），可作为可选高级功能。

### 6. 前端页面建议
- **添加项目页**：输入框 + 详细创建密钥教程（带截图）+ 支持平台列表。
- **项目仪表盘**：显示当前 MRR、增长曲线、同步状态。
- **公开展示页**：`/startup/slug` 或 `/verified/xxx`，SEO 友好，显示 verified badge + 数据。
- **排行榜**：按 MRR 排序、分类过滤。

### 7. 开发建议与注意事项
- **起步 MVP**：只支持 Stripe + 基础 MRR 计算 + 公开页面。
- **测试**：强烈建议先在 Stripe Test Mode 创建 restricted key 进行完整流程测试。
- **Rate Limit**：Stripe 有请求限制，同步任务需加重试 + 指数退避。
- **错误处理**：Key 失效（被用户删除）时自动标记为 inactive，并通知用户。
- **监控**：监控同步成功率、API 调用量。
- **未来扩展**：
  - 支持更多平台
  - 历史 MRR 图表
  - 公开收入 Feed
  - 可选 KYB 认证（结合之前讨论的 iDenfy / Shufti Pro）

### 8. 参考资料
- Stripe 官方文档：Restricted API Keys（https://docs.stripe.com/keys/restricted-api-keys）
- Stripe MRR 计算指南（搜索 “Calculating MRR in Billing”）
- TrustMRR FAQ（用户实际体验参考）

---
