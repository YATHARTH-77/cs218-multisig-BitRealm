// src/components/SubmitForm.tsx
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface SubmitFormProps {
  onSubmit: (to: string, valEth: string, data: string) => Promise<void>;
  disabled: boolean;
}

export default function SubmitForm({ onSubmit, disabled }: SubmitFormProps) {
  const [to, setTo] = useState("");
  const [val, setVal] = useState("0");
  const [data, setData] = useState("0x");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || disabled) return;
    setBusy(true);
    await onSubmit(to.trim(), val, data.trim() || "0x");
    setBusy(false);
    setTo("");
    setVal("0");
    setData("0x");
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
        <Send className="w-4 h-4" />
        Propose Transaction
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-xs font-medium text-slate-500">Recipient Address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 font-mono text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-500">Value (ETH)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-500">Calldata (Hex)</label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="0x"
              className="w-full px-3 py-2 font-mono text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={disabled || busy || !to.trim()}
          className="w-full py-2.5 mt-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Submitting..." : "Submit Transaction"}
        </motion.button>
      </div>
    </motion.form>
  );
}