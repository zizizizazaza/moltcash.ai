---
name: defi-executor
description: Execute DeFi operations on EVM chains. Supports token swaps (Uniswap V3), staking (Lido stETH), lending deposits (Aave V3), and testnet interactions (faucet, swap, bridge). Use when an agent needs to perform real on-chain transactions — deposit into DeFi protocols, swap tokens, stake ETH, or interact with testnets for airdrop farming.
---

# DeFi Executor Skill

Execute real on-chain DeFi transactions — powered by MoltCash.

## Prerequisites

1. **MoltCash API Key** — Automatically generated when user signs up on moltcash.com
   - Agent fetches key via `GET /api/auth/me` (returns `apiKey` field)
   - Set via `MOLTCASH_API_KEY` env variable
   - Free tier: 10 executions/day, Pro: unlimited
2. **Wallet Private Key** — set via `PRIVATE_KEY` env variable

## Quick Start

```bash
# 1. Fetch available opportunities from MoltCash
MOLTCASH_API_KEY=mc_xxx npx tsx scripts/fetch-tasks.ts

# 2. Execute a specific opportunity
MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts --taskId abc123

# 3. Or run a specific action directly
MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts \
  --action stake --chain ethereum --amount 0.1
```

## How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌───────────┐
│  OpenClaw    │────▶│  MoltCash API    │────▶│ Blockchain│
│  Agent       │     │  (task routing)  │     │ (on-chain)│
│              │◀────│  (credit track)  │◀────│           │
└──────────────┘     └──────────────────┘     └───────────┘
```

1. Agent calls MoltCash API → gets task details (which protocol, which chain, what params)
2. Agent executes the on-chain transaction using viem
3. Agent reports the txHash back to MoltCash API
4. MoltCash verifies on-chain → awards credits to user

**The skill requires a MoltCash API key to function.** Without it, the agent cannot discover opportunities or receive execution parameters.

## Available Scripts

### `fetch-tasks.ts` — Browse Opportunities

Fetches available auto-farm opportunities from MoltCash, sorted by reward.

```bash
MOLTCASH_API_KEY=mc_xxx npx tsx scripts/fetch-tasks.ts
MOLTCASH_API_KEY=mc_xxx npx tsx scripts/fetch-tasks.ts --type yield
MOLTCASH_API_KEY=mc_xxx npx tsx scripts/fetch-tasks.ts --type quest --chain Ethereum
```

Output: JSON array of opportunities with IDs, rewards, chains, and protocols.

### `execute.ts` — Execute a Task

Executes an opportunity by its MoltCash task ID. The API provides the exact execution parameters.

```bash
# Execute by task ID (recommended — MoltCash provides all params)
MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts --taskId abc123

# Or specify action directly
MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts \
  --action stake --chain ethereum --amount 0.1

MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts \
  --action swap --chain ethereum \
  --tokenIn 0xA0b8... --tokenOut 0xC02a... --amount 100

MOLTCASH_API_KEY=mc_xxx PRIVATE_KEY=0x... npx tsx scripts/execute.ts \
  --action deposit --chain ethereum --token 0xA0b8... --amount 1000
```

**Supported actions:** `stake`, `swap`, `deposit`, `testnet-swap`, `testnet-deploy`

### `report.ts` — Report Execution Result

After execution, reports the transaction hash back to MoltCash for verification and credit.

```bash
MOLTCASH_API_KEY=mc_xxx npx tsx scripts/report.ts \
  --taskId abc123 --txHash 0x... --chain ethereum
```

## Typical Agent Workflow

When a user says "help me earn yield on my ETH":

1. Agent runs `fetch-tasks.ts --type yield` → gets list of yield opportunities
2. Agent picks the best APY opportunity
3. Agent runs `execute.ts --taskId <id>` → executes on-chain
4. Agent runs `report.ts --taskId <id> --txHash <hash>` → earns credits
5. Agent tells the user: "Done! Staked 0.1 ETH into Lido at 3.2% APY. Tx: ..."

## Output Format

All scripts output JSON to stdout:
```json
{
  "success": true,
  "chain": "Ethereum",
  "action": "stake",
  "txHash": "0x...",
  "explorerUrl": "https://etherscan.io/tx/0x...",
  "credits": 50,
  "details": { ... }
}
```

## Safety

- Mainnet operations require explicit `--confirm` flag
- Testnet operations execute immediately (zero cost)
- Gas estimation runs before every transaction
- Slippage protection on all swaps (default 0.5%)
