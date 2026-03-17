# @lokacash/fiat

LokaCash fiat on-ramp SDK for third-party apps. Add “user deposits” with **Coinbase** (Privy fundWallet / Coinbase Onramp) and **Onramper**.

## Installation

```bash
npm install @lokacash/fiat
```

- **Option A (Privy)**: Your app must also install `@privy-io/react-auth`. We recommend wrapping the app with the SDK’s `LokaCashPrivyRoot` (see below).
- **Option B (Direct)**: You only pass the user’s wallet address. For Coinbase, optionally install `@coinbase/cbpay-js`. Onramper is configured inside the SDK; no extra dependencies.

---

## Option A: Privy (recommended for React)

For React apps that can use Privy. Reuses Privy’s `useFundWallet` and supports Onramper in a popup.

### 1. Root wrapper (recommended: LokaCashPrivyRoot)

The SDK ships with LokaCash’s Privy App ID. You only pass the `apiKey` assigned by LokaCash:

```tsx
import { LokaCashPrivyRoot } from '@lokacash/fiat/react';

const LOKACASH_API_KEY = 'your-lokacash-api-key'; // assigned by LokaCash

root.render(
  <LokaCashPrivyRoot apiKey={LOKACASH_API_KEY}>
    <App />
  </LokaCashPrivyRoot>
);
```

`LokaCashPrivyRoot` includes `PrivyProvider`, `LokaCashProvider`, and third-party provider init (e.g. Onramper). You don’t need to set a Privy App ID.

### 2. Optional: Your own Privy app

If you use your own Privy app, wrap with `PrivyProvider` and `LokaCashProvider`:

```tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { LokaCashProvider } from '@lokacash/fiat/react';

const PRIVY_APP_ID = 'your-privy-app-id';
const LOKACASH_API_KEY = 'your-lokacash-api-key';

root.render(
  <PrivyProvider appId={PRIVY_APP_ID}>
    <LokaCashProvider appId={PRIVY_APP_ID} apiKey={LOKACASH_API_KEY}>
      <App />
    </LokaCashProvider>
  </PrivyProvider>
);
```

Install Privy in your app: `npm install @privy-io/react-auth`.

### 3. Trigger deposit via button or Hook

```tsx
import { LokaCashDepositButton, useLokaCashDeposit } from '@lokacash/fiat/react';

// Option 1: Button (provider: coinbase | onramper)
<LokaCashDepositButton
  amount="100"
  asset="USDC"
  provider="coinbase"
  onSuccess={() => console.log('Deposit done')}
/>

// Option 2: Hook
function MyComponent() {
  const { open, isOpening } = useLokaCashDeposit();
  return (
    <button
      onClick={() =>
        open({
          amount: '50',
          asset: 'USDC',
          preferredProvider: 'onramper', // or 'coinbase'
        })
      }
      disabled={isOpening}
    >
      Deposit
    </button>
  );
}
```

**Requirement**: End users must log in or connect a wallet via Privy before depositing.

---

## Option B: Direct (no Privy)

For apps using any wallet (MetaMask, WalletConnect, etc.) without Privy. You only pass the user’s wallet address.

### 1. Init

```ts
import { LokaCashDeposit } from '@lokacash/fiat';

LokaCashDeposit.init({
  apiKey: 'your-lokacash-api-key',
  defaultProvider: 'coinbase', // or 'onramper'
});
```

### 2. Open deposit

After the user has connected a wallet and you have their address:

```ts
await LokaCashDeposit.open({
  address: userAddress,   // 0x... required
  amount: '100',
  asset: 'USDC',
  chainId: 8453,          // optional, default Base
  onSuccess: () => {},
  onError: (err) => console.error(err),
});
```

**Dependencies**:

- **Coinbase**: Install `@coinbase/cbpay-js` and configure Coinbase Onramp appId (can differ from apiKey; pass via init when we support it).
- **Onramper**: Configured inside the SDK; no install or config needed in your app.

---

## API summary

| Method / Component | Description |
|--------------------|-------------|
| `<LokaCashPrivyRoot apiKey={...}>` | Option A one-step root (includes PrivyProvider + LokaCashProvider; recommended) |
| `<LokaCashProvider>` | Option A manual setup (appId + apiKey) |
| `useLokaCashDeposit()` | React Hook; returns `{ open, isOpening, error }` |
| `<LokaCashDepositButton>` | Option A deposit button |
| `LokaCashDeposit.init(options)` | Init (Option A: pass `privyAppId`; Option B: pass `apiKey` only) |
| `LokaCashDeposit.open(options)` | Option B open deposit; requires `address` |

---

## Types

TypeScript types are included; import from the main entry or `@lokacash/fiat/react`:

- `DepositProvider`: `'coinbase' | 'onramper'`
- `DepositAsset`: `'USDC' | 'ETH'`
- `LokaCashDepositInitOptions`, `OpenDepositOptionsStandalone`, `OpenDepositOptionsPrivy`, etc.

---

## Development

```bash
npm install
npm run build
```

Output is in `dist/`: `dist/index.js` (Option B) and `dist/react.js` (Option A React).

---

## References

- [Privy Funding](https://docs.privy.io/guide/react/funding)
- [Coinbase Onramp](https://docs.cloud.coinbase.com/onramp/docs/overview)
- [Onramper](https://onramper.com/)