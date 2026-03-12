
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmm5pmk0d00sf0dl1sq4q7r1j"
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#000000',
          landingHeader: 'Sign in to MoltCash',
          loginMessage: 'Connect your wallet or social account to start earning',
          showWalletLoginFirst: false,
        },
        loginMethodsAndOrder: {
          primary: ['google', 'twitter'],
          overflow: ['metamask', 'phantom', 'okx_wallet', 'coinbase_wallet', 'rainbow'],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
