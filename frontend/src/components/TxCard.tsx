// src/components/TxCard.tsx
"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tx } from "../hooks/useMultisig";

interface TxCardProps {
  tx: Tx;
  required: number;
  isOwner: boolean;
  onApprove: (id: number) => void;
  onRevoke: (id: number) => void;
  onExecute: (id: number) => void;
}

export default function TxCard({ tx, required, isOwner, onApprove, onRevoke, onExecute }: TxCardProps) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const pct = required > 0 ? Math.min((tx.approvalCount / required) * 100, 100) : 0;
  const ready = !tx.executed && tx.approvalCount >= required;
  const barColor = tx.executed ? "bg-green-500" : pct >= 100 ? "bg-indigo-500" : "bg-blue-500";
  const shortTo = `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`;

  const handleAction = async (action: (id: number) => void) => {
    setBusy(true);
    await action(tx.id);
    setBusy(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 bg-white border rounded-2xl shadow-sm transition-colors ${
        tx.executed ? "border-green-200 bg-green-50/30" : ready ? "border-indigo-300" : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 font-mono text-xs font-medium border rounded-md text-slate-500 bg-slate-50 border-slate-200">
            #{tx.id}
          </span>
          {tx.executed ? (
            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md">Executed</span>
          ) : ready ? (
            <span className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-md">Ready ✓</span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md">Pending</span>
          )}
        </div>
        <span className="font-mono text-sm font-bold text-slate-800">{tx.value} ETH</span>
      </div>

      {/* Recipient */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-slate-500">To:</span>
        <span className="font-mono text-slate-700">{shortTo}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5 text-xs text-slate-500">
          <span>Approvals</span>
          <span className="font-mono">{tx.approvalCount} / {required}</span>
        </div>
        <div className="w-full h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`} 
          />
        </div>
      </div>

      {/* Calldata Accordion */}
      {tx.data && tx.data !== "0x" && (
        <div className="mb-4">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 focus:outline-none"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            View Calldata
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-2 mt-2 font-mono text-xs break-all border rounded-lg bg-slate-50 text-slate-500 border-slate-200">
                  {tx.data}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      {!tx.executed && isOwner && (
        <div className="flex gap-2 mt-4">
          {!tx.approvedByMe ? (
            <button
              onClick={() => handleAction(onApprove)}
              disabled={busy}
              className="flex items-center justify-center flex-1 gap-1 py-2 text-xs font-medium text-indigo-700 transition-colors bg-indigo-100 border border-indigo-200 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
          ) : (
            <button
              onClick={() => handleAction(onRevoke)}
              disabled={busy}
              className="flex items-center justify-center flex-1 gap-1 py-2 text-xs font-medium text-red-700 transition-colors bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" /> Revoke
            </button>
          )}

          {ready && (
            <button
              onClick={() => handleAction(onExecute)}
              disabled={busy}
              className="flex items-center justify-center flex-1 gap-1 py-2 text-xs font-medium text-green-700 transition-colors bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" /> Execute
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}   