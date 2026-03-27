import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // 👈 We need this to resolve our directory paths

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      // 🔗 This perfectly matches the "@/*" paths we set up in tsconfig.json!
      // Now you can import like: import Button from '@/components/Button'
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // 🚀 Tells Vite to build using modern JavaScript features. 
    // This makes the bundle smaller and faster for Web3 apps.
    target: 'esnext',
    
    // Optional but recommended: Chunks large Web3 libraries separately 
    // so your app loads instantly for returning users.
    rollupOptions: {
      output: {
        manualChunks: {
          web3: ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
