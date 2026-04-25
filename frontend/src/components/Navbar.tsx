// src/components/Navbar.tsx
"use client";
import { Wallet, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { WalletState } from "../hooks/useWallet";

interface NavbarProps {
  wallet: WalletState & { connect: () => void; disconnect: () => void };
  isOwner: boolean;
}

export default function Navbar({ wallet, isOwner }: NavbarProps) {
  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 border border-indigo-200 rounded-xl">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-900">BitRealm</h1>
          <p className="text-xs font-medium text-slate-500">MultiSig Vault</p>
        </div>
      </div>

      <div>
        {wallet.address ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium border rounded-full bg-slate-50 border-slate-200 text-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-mono">{shortAddress(wallet.address)}</span>
              {wallet.balance && (
                <span className="pl-3 border-l font-mono border-slate-300">
                  {wallet.balance} ETH
                </span>
              )}
              {isOwner && (
                <span className="px-2 py-0.5 ml-1 text-xs text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-md">
                  Owner
                </span>
              )}
            </div>
            <button
              onClick={wallet.disconnect}
              className="p-2 transition-colors border rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-slate-50 border-slate-200"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={wallet.connect}
            disabled={wallet.connecting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors bg-indigo-100 border border-indigo-200 rounded-xl hover:bg-indigo-200 disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            {wallet.connecting ? "Connecting..." : "Connect MetaMask"}
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}