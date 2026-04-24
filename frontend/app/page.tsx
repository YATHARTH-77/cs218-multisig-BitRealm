"use client";
import { useEffect, useState } from "react";
import {
  Wallet, RefreshCw, LogOut, ShieldCheck, Users, Hash,
  Send, CheckCircle2, XCircle, Play, AlertTriangle,
  X, Copy, Check, Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useMultisig, type Tx } from "@/hooks/useMultisig";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      title="Copy address"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="opacity-40 hover:opacity-80 transition-opacity"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1, color: "inherit" }}
    >
      {ok ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function Toast({
  msg, type, onClose,
}: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  const ok = type === "ok";
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      maxWidth: 380, display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px", borderRadius: 12,
      border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
      background: ok ? "#f0fdf4" : "#fff1f2",
      color: ok ? "#15803d" : "#b91c1c",
      fontSize: 12, fontFamily: "monospace",
      boxShadow: "0 8px 24px rgba(0,0,0,.1)",
      animation: "fadeUp .2s ease-out",
    }}>
      {ok
        ? <CheckCircle2 size={14} style={{ marginTop: 1, flexShrink: 0 }} />
        : <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />}
      <span style={{ flex: 1, wordBreak: "break-all", lineHeight: 1.6 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, lineHeight: 1, color: "inherit" }}>
        <X size={12} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color,
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", lineHeight: 1, fontFamily: "monospace" }}>
          {value}{sub && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)", marginLeft: 2 }}>{sub}</span>}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TX Card
// ─────────────────────────────────────────────────────────────
function TxCard({
  tx, required, isOwner,
  onApprove, onRevoke, onExecute,
}: {
  tx: Tx; required: number; isOwner: boolean;
  onApprove: (id: number) => void;
  onRevoke: (id: number) => void;
  onExecute: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pct = required > 0 ? Math.min((tx.approvalCount / required) * 100, 100) : 0;
  const ready = !tx.executed && tx.approvalCount >= required;

  async function act(fn: (id: number) => Promise<void> | void) {
    setBusy(true);
    await fn(tx.id);
    setBusy(false);
  }

  const barColor = tx.executed ? "#22c55e" : pct >= 100 ? "#22c55e" : "#6366f1";

  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 12,
      border: tx.executed ? "1px solid #bbf7d0" : ready ? "1px solid #c7d2fe" : "1px solid var(--border)",
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color .15s",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 10, fontFamily: "monospace", padding: "2px 6px",
            borderRadius: 5, border: "1px solid var(--border)",
            color: "var(--muted)", background: "var(--surface)",
          }}>#{tx.id}</span>

          {tx.executed && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d" }}>
              Executed
            </span>
          )}
          {!tx.executed && ready && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca" }}>
              Ready ✓
            </span>
          )}
          {!tx.executed && !ready && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c" }}>
              Pending
            </span>
          )}
        </div>
        <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
          {parseFloat(tx.value).toFixed(4)} ETH
        </span>
      </div>

      {/* To */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ color: "var(--muted)" }}>To</span>
        <span style={{ fontFamily: "monospace", color: "var(--text-2)" }}>{short(tx.to)}</span>
        <CopyBtn text={tx.to} />
      </div>

      {/* Approval bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>
          <span>Approvals</span>
          <span style={{ fontFamily: "monospace" }}>{tx.approvalCount} / {required}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "var(--surface)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: barColor, transition: "width .4s, background .3s" }} />
        </div>
      </div>

      {/* Calldata expand */}
      {tx.data && tx.data !== "0x" && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            calldata
          </button>
          {expanded && (
            <div style={{
              marginTop: 6, fontSize: 10, fontFamily: "monospace", color: "var(--muted)",
              background: "var(--surface)", borderRadius: 6, padding: "7px 10px",
              wordBreak: "break-all", lineHeight: 1.6,
            }}>
              {tx.data}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!tx.executed && isOwner && (
        <div style={{ display: "flex", gap: 7, marginTop: 2 }}>
          {!tx.approvedByMe ? (
            <button
              onClick={() => act(onApprove)}
              disabled={busy}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
                border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca",
                fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <CheckCircle2 size={12} /> Approve
            </button>
          ) : (
            <button
              onClick={() => act(onRevoke)}
              disabled={busy}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
                border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c",
                fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <XCircle size={12} /> Revoke
            </button>
          )}

          {ready && (
            <button
              onClick={() => act(onExecute)}
              disabled={busy}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
                border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d",
                fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Play size={12} /> Execute
            </button>
          )}
        </div>
      )}

      {tx.executed && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#15803d" }}>
          <CheckCircle2 size={12} /> Transaction executed successfully
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Submit Form
// ─────────────────────────────────────────────────────────────
function SubmitForm({
  onSubmit, disabled,
}: { onSubmit: (to: string, val: string, data: string) => Promise<void>; disabled: boolean }) {
  const [to, setTo] = useState("");
  const [val, setVal] = useState("0");
  const [data, setData] = useState("0x");
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (!to.trim()) return;
    setBusy(true);
    await onSubmit(to.trim(), val, data.trim() || "0x");
    setBusy(false);
    setTo(""); setVal("0"); setData("0x");
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 12,
    border: "1px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontFamily: "monospace", outline: "none",
  };

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Send size={12} /> Propose transaction
      </p>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Recipient address</label>
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="0x…" style={inp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Value (ETH)</label>
          <input type="number" min="0" step="0.001" value={val} onChange={e => setVal(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Calldata (hex)</label>
          <input value={data} onChange={e => setData(e.target.value)} placeholder="0x" style={inp} />
        </div>
      </div>

      <button
        onClick={handle}
        disabled={disabled || busy || !to.trim()}
        style={{
          width: "100%", padding: "9px", borderRadius: 8, cursor: "pointer",
          border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca",
          fontSize: 13, fontWeight: 500,
          opacity: disabled || busy || !to.trim() ? 0.45 : 1,
          transition: "opacity .15s",
        }}
      >
        {busy ? "Submitting…" : "Submit transaction"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CSS vars injected once
// ─────────────────────────────────────────────────────────────
const lightVars = `
  :root {
    --card-bg: #ffffff;
    --surface: #f5f5f3;
    --border: #e5e5e3;
    --text: #111111;
    --text-2: #444444;
    --muted: #888888;
    --topbar-bg: #ffffffee;
  }
`;
const darkVars = `
  @media (prefers-color-scheme: dark) {
    :root {
      --card-bg: #18181b;
      --surface: #111113;
      --border: #2a2a30;
      --text: #f0f0f0;
      --text-2: #aaaaaa;
      --muted: #666680;
      --topbar-bg: #18181bee;
    }
  }
`;

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Page() {
  const wallet = useWallet();
  const ms = useMultisig(wallet.signer, wallet.provider);
  const [filter, setFilter] = useState<"all" | "pending" | "executed">("all");

  const isOwner = wallet.address
    ? ms.owners.some(o => o.toLowerCase() === wallet.address!.toLowerCase())
    : false;

  useEffect(() => {
  if (wallet.address && wallet.provider) ms.refresh();
  }, [wallet.address, wallet.chainId]);

  const filtered = ms.txs.filter(tx =>
    filter === "pending" ? !tx.executed : filter === "executed" ? tx.executed : true
  );

  const pendingCount = ms.txs.filter(t => !t.executed).length;
  const executedCount = ms.txs.filter(t => t.executed).length;

  return (
    <>
      <style>{lightVars + darkVars}</style>

      {/* ── Topbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--topbar-bg)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#eef2ff", border: "1px solid #c7d2fe",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={14} color="#4338ca" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>BitRealm</p>
            <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.2 }}>MultiSig Vault</p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {wallet.address && (
            <button
              onClick={ms.refresh} disabled={ms.loading}
              title="Refresh"
              style={{
                width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                border: "1px solid var(--border)", background: "var(--card-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--muted)", opacity: ms.loading ? 0.5 : 1,
              }}
            >
              <RefreshCw size={13} className={ms.loading ? "spin" : ""} />
            </button>
          )}

          {wallet.address ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 20,
                border: "1px solid var(--border)", background: "var(--card-bg)",
                fontSize: 12, color: "var(--text-2)",
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontFamily: "monospace" }}>{short(wallet.address)}</span>
                {wallet.chainId && (
                  <span style={{
                    fontSize: 10, padding: "1px 5px", borderRadius: 4,
                    border: "1px solid var(--border)", color: "var(--muted)",
                  }}>#{wallet.chainId}</span>
                )}
                {isOwner && (
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 4,
                    background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4338ca",
                  }}>owner</span>
                )}
              </div>
              <button
                onClick={wallet.disconnect}
                title="Disconnect"
                style={{
                  width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                  border: "1px solid var(--border)", background: "var(--card-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)",
                }}
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={wallet.connect} disabled={wallet.connecting}
              style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca",
                fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                opacity: wallet.connecting ? 0.6 : 1,
              }}
            >
              <Wallet size={13} />
              {wallet.connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px" }}>
        {!wallet.address ? (
          /* ── Landing ── */
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "#eef2ff", border: "1px solid #c7d2fe",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}>
              <Lock size={28} color="#4338ca" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>BitRealm MultiSig</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 380, lineHeight: 1.7, marginBottom: 10 }}>
              M-of-N multi-signature vault. Any owner submits a transaction, each owner approves independently,
              and execution happens once M approvals are reached.
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28, fontFamily: "monospace" }}>
              Contract: {`0x5FbDB2315678afecb367f032d93F642f64180aa3`}
            </p>
            <button
              onClick={wallet.connect} disabled={wallet.connecting}
              style={{
                padding: "10px 24px", borderRadius: 10, cursor: "pointer",
                border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca",
                fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
                opacity: wallet.connecting ? 0.6 : 1,
              }}
            >
              <Wallet size={16} />
              {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
            </button>
            {wallet.error && (
              <p style={{ marginTop: 12, fontSize: 12, color: "#b91c1c", fontFamily: "monospace" }}>{wallet.error}</p>
            )}

            {/* How it works */}
            <div style={{
              marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, width: "100%", maxWidth: 600,
            }}>
              {[
                { n: "1", title: "Submit", desc: "Any owner proposes a transaction with recipient, ETH value, and optional calldata." },
                { n: "2", title: "Approve", desc: "Each owner independently approves or revokes until M signatures are collected." },
                { n: "3", title: "Execute", desc: "Any owner triggers execution once the threshold is met. Calldata runs on-chain." },
              ].map(s => (
                <div key={s.n} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "16px 14px", textAlign: "left",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: "#eef2ff", color: "#4338ca",
                    fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                  }}>{s.n}</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Dashboard ── */
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              <StatCard icon={<Users size={16} />} label="Owners" value={ms.owners.length || "—"} color="#6366f1" />
              <StatCard icon={<ShieldCheck size={16} />} label="Threshold" value={ms.required || "—"} sub={ms.owners.length ? `/ ${ms.owners.length}` : ""} color="#f59e0b" />
              <StatCard icon={<Hash size={16} />} label="Transactions" value={ms.txs.length} sub={pendingCount > 0 ? `  ${pendingCount} pending` : ""} color="#22c55e" />
            </div>

            {/* Non-owner notice */}
            {!isOwner && wallet.address && ms.owners.length > 0 && (
              <div style={{
                padding: "10px 14px", borderRadius: 9,
                border: "1px solid #fed7aa", background: "#fff7ed",
                fontSize: 12, color: "#c2410c", display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertTriangle size={13} />
                Your connected wallet is not an owner of this contract. You can view transactions but cannot approve or execute.
              </div>
            )}

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "start" }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Submit form — owners only */}
                {isOwner
                  ? <SubmitForm onSubmit={ms.submit} disabled={!wallet.signer} />
                  : (
                    <div style={{
                      background: "var(--card-bg)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: "16px", textAlign: "center",
                    }}>
                      <Lock size={20} color="var(--muted)" style={{ margin: "0 auto 8px" }} />
                      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>Only owners can propose transactions.</p>
                    </div>
                  )
                }

                {/* Owners list */}
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={12} /> Owners ({ms.owners.length})
                  </p>

                  {ms.owners.length === 0 ? (
                    <div>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 32, marginBottom: 6 }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ms.owners.map(o => {
                        const me = wallet.address?.toLowerCase() === o.toLowerCase();
                        return (
                          <div key={o} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", borderRadius: 8, fontSize: 11,
                            fontFamily: "monospace",
                            border: me ? "1px solid #c7d2fe" : "1px solid var(--border)",
                            background: me ? "#eef2ff" : "var(--surface)",
                            color: me ? "#4338ca" : "var(--text-2)",
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: me ? "#4338ca" : "var(--muted)", flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{short(o)}</span>
                            <CopyBtn text={o} />
                            {me && <span style={{ fontSize: 10, border: "1px solid #c7d2fe", borderRadius: 4, padding: "1px 5px", color: "#4338ca" }}>you</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {ms.required > 0 && (
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                      Requires <strong style={{ color: "var(--text)" }}>{ms.required}</strong> of {ms.owners.length} approvals to execute
                    </p>
                  )}
                </div>
              </div>

              {/* Right column — tx list */}
              <div>
                {/* Filter tabs + count */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  {(["all", "pending", "executed"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: "5px 14px", borderRadius: 7, cursor: "pointer",
                      fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 500,
                      border: filter === f ? "1px solid #c7d2fe" : "1px solid var(--border)",
                      background: filter === f ? "#eef2ff" : "var(--card-bg)",
                      color: filter === f ? "#4338ca" : "var(--muted)",
                      transition: "all .15s",
                    }}>
                      {f}
                      {f === "pending" && pendingCount > 0 && (
                        <span style={{ marginLeft: 5, background: "#f59e0b", color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 10 }}>{pendingCount}</span>
                      )}
                    </button>
                  ))}
                  {ms.loading && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
                      <RefreshCw size={11} className="spin" style={{ display: "inline" }} /> syncing…
                    </span>
                  )}
                </div>

                {/* Skeleton */}
                {ms.loading && ms.txs.length === 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
                  </div>
                )}

                {/* Empty state */}
                {!ms.loading && filtered.length === 0 && (
                  <div style={{
                    border: "1px solid var(--border)", borderRadius: 12,
                    background: "var(--card-bg)",
                    padding: "48px 20px", textAlign: "center",
                    color: "var(--muted)", fontSize: 13,
                  }}>
                    <Hash size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                    {filter === "all" ? "No transactions yet. Submit one using the form." : `No ${filter} transactions.`}
                  </div>
                )}

                {/* TX grid */}
                {filtered.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {filtered.map(tx => (
                      <TxCard
                        key={tx.id} tx={tx}
                        required={ms.required} isOwner={isOwner}
                        onApprove={ms.approve} onRevoke={ms.revoke} onExecute={ms.execute}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toasts */}
      {ms.success && <Toast msg={ms.success} type="ok" onClose={ms.clearToasts} />}
      {ms.error && <Toast msg={ms.error} type="err" onClose={ms.clearToasts} />}
      {wallet.error && !ms.error && <Toast msg={wallet.error} type="err" onClose={() => {}} />}
    </>
  );
}