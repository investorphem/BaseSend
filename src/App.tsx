import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseEther, parseUnits, parseAbi, isAddress } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Send, History, Coins, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const CONTRACT_ADDRESS = '0x883f9868C5D44B16949ffF77fe56c4d9A9C2cfbD';
const ABI = parseAbi([
  "function multisendETH(address[] recipients, uint256[] values) external payable",
  "function multisendToken(address token, address[] recipients, uint256[] values) external",
  "function approve(address spender, uint256 amount) external returns (bool)"
]);

export default function App() {
  const { isConnected, chain, address } = useAccount();
  const config = useConfig();
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Form States
  const [recipients, setRecipients] = useState('');
  const [amounts, setAmounts] = useState('');
  const [tokenAddr, setTokenAddr] = useState('');

  const { writeContractAsync } = useWriteContract();

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`tx_history_${address}`);
    if (saved) setHistory(JSON.parse(saved));
  }, [address]);

  const handleSend = async (type: 'ETH' | 'TOKEN') => {
    if (!isConnected) return toast.error("Please connect your wallet first.");
    if (chain?.id !== 8453) return toast.error("Please switch to the Base Network.");
    if (!recipients || !amounts) return toast.error("Recipients and amounts cannot be empty.");

    const addrs = recipients.replace(/[\[\]"]/g, '').split(',').map(a => a.trim()).filter(a => a);
    const amts = amounts.replace(/[\[\]"]/g, '').split(',').map(a => a.trim()).filter(a => a);

    // 1. Validation: Array lengths
    if (addrs.length !== amts.length) {
      return toast.error("Mismatch: Number of recipients must match number of amounts.");
    }

    // 2. Validation: Valid addresses
    const invalidAddresses = addrs.filter(addr => !isAddress(addr));
    if (invalidAddresses.length > 0) {
      return toast.error(`Invalid address detected: ${invalidAddresses[0]}`);
    }

    const safeAddrs = addrs as `0x${string}`[];
    const toastId = toast.loading("Initiating transaction...");

    try {
      setIsProcessing(true);
      const units = amts.map(a => type === 'ETH' ? parseEther(a) : parseUnits(a, 18));
      const total = units.reduce((acc, v) => acc + v, 0n);

      let txHash;
      if (type === 'ETH') {
        toast.loading("Please confirm the ETH transfer in your wallet...", { id: toastId });
        txHash = await writeContractAsync({ 
          address: CONTRACT_ADDRESS, abi: ABI, functionName: 'multisendETH', 
          args: [safeAddrs, units], value: total 
        });
      } else {
        if (!isAddress(tokenAddr)) throw new Error("Invalid Token Contract Address");
        
        toast.loading("Please confirm token approval...", { id: toastId });
        const approveHash = await writeContractAsync({
          address: tokenAddr as `0x${string}`, abi: ABI, functionName: 'approve', args: [CONTRACT_ADDRESS, total]
        });
        
        toast.loading("Waiting for approval confirmation...", { id: toastId });
        await waitForTransactionReceipt(config, { hash: approveHash });
        
        toast.loading("Please confirm the batch transfer...", { id: toastId });
        txHash = await writeContractAsync({ 
          address: CONTRACT_ADDRESS, abi: ABI, functionName: 'multisendToken', args: [tokenAddr as `0x${string}`, safeAddrs, units] 
        });
      }

      toast.loading("Waiting for network confirmation...", { id: toastId });
      await waitForTransactionReceipt(config, { hash: txHash });

      // Record successful transaction
      const newTx = { hash: txHash, type, time: Date.now(), count: addrs.length };
      const updatedHistory = [newTx, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem(`tx_history_${address}`, JSON.stringify(updatedHistory));

      toast.success("Batch transfer completed successfully!", { id: toastId });
      
      // Clear forms on success
      setRecipients('');
      setAmounts('');

    } catch (e: any) {
      console.error(e);
      toast.error(e.shortMessage || e.message || "Transaction Failed", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    {/* Notice the new modern gradient background */}
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-purple-50 flex font-sans text-slate-800">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - Upgraded to Glassmorphism */}
      <aside className="w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 p-6 hidden md:flex flex-col shadow-[1px_0_20px_rgb(0,0,0,0.02)] z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Coins size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">BaseSend</span>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('send')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === 'send' ? 'bg-white shadow-sm text-blue-600 border border-white' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Send size={18} className={activeTab === 'send' ? 'text-blue-500' : ''} /> Batch Transfer
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600 border border-white' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <History size={18} className={activeTab === 'history' ? 'text-blue-500' : ''} /> Transaction History
          </button>
        </nav>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {activeTab === 'send' ? 'New Transfer' : 'Your History'}
            </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              {activeTab === 'send' ? 'Distribute tokens to multiple addresses safely.' : 'Review your past batch transactions.'}
            </p>
          </div>
          <ConnectButton />
        </header>

        {activeTab === 'send' ? (
          <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section - Glass Card with upgraded inputs */}
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Token Contract (Optional)</label>
                    <input 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 placeholder:text-slate-300 font-mono text-sm"
                      placeholder="0x... Leave blank for native ETH" 
                      value={tokenAddr} onChange={e => setTokenAddr(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Recipients</label>
                      <textarea 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 h-52 text-sm font-mono placeholder:text-slate-300 resize-none leading-relaxed"
                        placeholder="0x123...&#10;0x456..." 
                        value={recipients} onChange={e => setRecipients(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Amounts</label>
                      <textarea 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border border-slate-200/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 h-52 text-sm font-mono placeholder:text-slate-300 resize-none leading-relaxed"
                        placeholder="0.1&#10;0.05" 
                        value={amounts} onChange={e => setAmounts(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgraded Buttons with Hover Lifts & Shadows */}
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSend('ETH')}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Send Native ETH
                </button>
                <button 
                  onClick={() => handleSend('TOKEN')}
                  disabled={isProcessing}
                  className="flex-1 bg-white/80 backdrop-blur-md border border-slate-200 hover:border-blue-300 hover:bg-white text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.03)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Coins size={20} />} Send ERC-20 Tokens
                </button>
              </div>
            </section>

            {/* Sidebar Stats */}
            <aside className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-7 rounded-[2rem] text-white shadow-[0_15px_30px_rgba(59,130,246,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <h3 className="flex items-center gap-2 font-bold mb-6 text-white/90"><ShieldCheck size={20} /> Network Status</h3>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <span className="text-white/70">Chain</span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg font-mono">Base Mainnet</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Status</span>
                    <span className="flex items-center gap-2 bg-green-500/20 text-green-100 px-3 py-1 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" /> 
                      Operational
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-xl p-7 rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="font-bold text-slate-800 mb-5">Transfer Guide</h3>
                <ul className="space-y-4 text-sm text-slate-500 leading-relaxed font-medium">
                  <li className="flex gap-3"><ArrowRight size={16} className="text-blue-500 shrink-0 mt-0.5" /> Ensure identical line breaks or commas for addresses and amounts.</li>
                  <li className="flex gap-3"><ArrowRight size={16} className="text-blue-500 shrink-0 mt-0.5" /> Keep enough ETH in your wallet to cover gas.</li>
                  <li className="flex gap-3"><ArrowRight size={16} className="text-blue-500 shrink-0 mt-0.5" /> Tokens require a prompt to Appove spending first.</li>
                </ul>
              </div>
            </aside>
          </div>
        ) : (
          /* History Table Section - Upgraded to match */
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100/80">
                  <th className="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Transaction Hash</th>
                  <th className="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Type</th>
                  <th className="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Recipients</th>
                  <th className="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {history.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-slate-50/50 transition-colors duration-200">
                    <td className="px-8 py-5 font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[200px] transition-colors">{tx.hash}</td>
                    <td className="px-8 py-5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${tx.type === 'ETH' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{tx.count} addresses</td>
                    <td className="px-8 py-5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl w-fit border border-green-100">
                        <CheckCircle2 size={14} /> Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <History size={24} />
                </div>
                <p className="text-slate-500 font-medium">No recent transactions found.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
