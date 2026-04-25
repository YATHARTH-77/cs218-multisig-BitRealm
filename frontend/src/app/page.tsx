// src/app/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Users, ShieldCheck, Hash, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Hooks
import { useWallet } from "../hooks/useWallet";
import { useMultisig } from "../hooks/useMultisig";

// Components
import Navbar from "../components/Navbar";
import SubmitForm from "../components/SubmitForm";
import TxCard from "../components/TxCard";

export default function Home() {
  const wallet = useWallet();
  const ms = useMultisig(wallet.signer, wallet.provider);
  const [filter, setFilter] = useState<"all" | "pending" | "executed">("all");

  // Determine if connected wallet is an owner
  const isOwner = wallet.address
    ? ms.owners.some((o) => o.toLowerCase() === wallet.address!.toLowerCase())
    : false;

  // Auto-refresh contract data when wallet connects
  useEffect(() => {
    if (wallet.address && wallet.provider) {
      ms.refresh();
    }
  }, [wallet.address, wallet.provider]);

  // Derived state
  const filteredTxs = ms.txs.filter((tx) =>
    filter === "pending" ? !tx.executed : filter === "executed" ? tx.executed : true
  );
  const pendingCount = ms.txs.filter((t) => !t.executed).length;

  return (
    <div className="min-h-screen relative selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50" />

      <Navbar wallet={wallet} isOwner={isOwner} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!wallet.address ? (
            /* ─── DISCONNECTED: HERO LANDING ─── */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <div className="w-20 h-20 bg-indigo-100 border border-indigo-200 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                Institutional Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">MultiSig</span>
              </h1>
              <p className="max-w-lg text-lg text-slate-500 mb-10 leading-relaxed">
                M-of-N multi-signature vault. Propose transactions, collect independent approvals, and execute on-chain securely.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={wallet.connect}
                disabled={wallet.connecting}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {wallet.connecting ? "Initializing Bridge..." : "Connect MetaMask to Enter"}
              </motion.button>
            </motion.div>
          ) : (
            /* ─── CONNECTED: DASHBOARD ─── */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-8"
            >
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Owners" value={ms.owners.length || "—"} color="text-indigo-600" bg="bg-indigo-100" border="border-indigo-200" />
                <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Required Threshold" value={ms.required || "—"} color="text-amber-600" bg="bg-amber-100" border="border-amber-200" />
                <StatCard icon={<Hash className="w-5 h-5" />} label="Pending Transactions" value={pendingCount} color="text-emerald-600" bg="bg-emerald-100" border="border-emerald-200" />
              </div>

              {/* Non-Owner Warning */}
              {!isOwner && ms.owners.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-2xl text-sm font-medium">
                  <AlertTriangle className="w-5 h-5" />
                  Your connected wallet is not an authorized owner. You are in View-Only mode.
                </div>
              )}

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left Column (Forms & Owners) */}
                <div className="flex flex-col gap-6">
                  {isOwner ? (
                    <SubmitForm onSubmit={ms.submit} disabled={!wallet.signer} />
                  ) : (
                    <div className="p-6 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">Only owners can propose transactions.</p>
                    </div>
                  )}

                  {/* Owners List */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4" /> Authorized Owners
                    </h3>
                    <div className="flex flex-col gap-2">
                      {ms.owners.length === 0 && ms.loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)
                      ) : (
                        ms.owners.map((o) => {
                          const me = wallet.address?.toLowerCase() === o.toLowerCase();
                          return (
                            <div key={o} className={`flex items-center justify-between p-3 rounded-xl font-mono text-xs border ${me ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                              <span>{o.slice(0, 6)}...{o.slice(-4)}</span>
                              {me && <span className="px-2 py-1 text-[10px] font-bold uppercase bg-indigo-100 rounded-md">You</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (Transaction Feed) */}
                <div className="lg:col-span-2">
                  {/* Feed Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                      {(["all", "pending", "executed"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    {ms.loading && <div className="text-xs font-medium text-slate-400 animate-pulse">Syncing Chain...</div>}
                  </div>

                  {/* Transactions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ms.loading && ms.txs.length === 0 ? (
                      [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)
                    ) : filteredTxs.length > 0 ? (
                      filteredTxs.map((tx) => (
                        <TxCard
                          key={tx.id}
                          tx={tx}
                          required={ms.required}
                          isOwner={isOwner}
                          onApprove={ms.approve}
                          onRevoke={ms.revoke}
                          onExecute={ms.execute}
                        />
                      ))
                    ) : (
                      <div className="sm:col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
                        No transactions found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── TOAST NOTIFICATIONS ─── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {ms.success && <Toast msg={ms.success} type="success" onClose={ms.clearToasts} />}
          {ms.error && <Toast msg={ms.error} type="error" onClose={ms.clearToasts} />}
          {wallet.error && !ms.error && <Toast msg={wallet.error} type="error" onClose={() => {}} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── UTILITY COMPONENTS ───

function StatCard({ icon, label, value, color, bg, border }: { icon: React.ReactNode, label: string, value: string | number, color: string, bg: string, border: string }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className={`p-3 rounded-xl ${bg} ${color} ${border} border`}>{icon}</div>
      <div>
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="text-2xl font-mono font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string, type: "success" | "error", onClose: () => void }) {
  const isOk = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`flex items-start gap-3 p-4 max-w-sm rounded-2xl shadow-xl border ${isOk ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}
    >
      {isOk ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
      <p className="text-sm font-medium leading-relaxed break-words">{msg}</p>
      <button onClick={onClose} className="p-1 ml-auto rounded-full hover:bg-black/5 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}