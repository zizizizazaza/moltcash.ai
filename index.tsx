import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim();
if (!privyAppId) {
  throw new Error('Missing VITE_PRIVY_APP_ID. Please set it in your .env file.');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
