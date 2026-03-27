import { http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'BaseSend', // Keeping it consistent with your UI branding
  projectId: 'ca132d38f537cfc97cb1098e0c41d78a', // Your WalletConnect Cloud ID
  // 🔗 Added Base Sepolia so users can test transfers safely without spending real ETH
  chains: [base, baseSepolia], 
  transports: {
    // ⚡ Explicitly defining the official public RPCs to avoid default Wagmi rate limits.
    // Pro-tip: Replace these with your own Alchemy or Infura URLs for production!
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});
