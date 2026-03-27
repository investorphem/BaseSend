import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

// 🛠️ Optimize React Query for Web3 UX
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevents spamming your RPC provider every time the user switches browser tabs
      refetchOnWindowFocus: false, 
      // Limits retries so users aren't stuck staring at loaders if a node goes down
      retry: 1, 
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* 🎨 Custom RainbowKit Theme to match our new glass UI */}
        <RainbowKitProvider 
          theme={lightTheme({
            accentColor: '#2563eb', // Matches our Tailwind blue-600 buttons
            accentColorForeground: 'white',
            borderRadius: 'large', // Gives the modal those nice rounded corners
            fontStack: 'system', // Inherits our crisp Inter font from index.css
            overlayBlur: 'small', // Adds a modern blur behind the modal when it opens
          })}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
