"use client";
import { useEffect, useState } from "react";
import {
  Wallet, RefreshCw, LogOut, ShieldCheck, Users, Hash,
  Send, CheckCircle2, XCircle, Play, AlertTriangle,
  X, Copy, Check, Lock, ChevronDown, ChevronUp, Zap,
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
      className="copy-btn"
    >
      {ok ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  const ok = type === "ok";
  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      </div>
      <span className="toast-msg">{msg}</span>
      <button onClick={onClose} className="toast-close"><X size={11} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="stat-card" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value">
          {value}
          {sub && <span className="stat-sub">{sub}</span>}
        </p>
      </div>
      <div className="stat-glow" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TX Card
// ─────────────────────────────────────────────────────────────
function TxCard({ tx, required, isOwner, onApprove, onRevoke, onExecute }: {
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

  const status = tx.executed ? "executed" : ready ? "ready" : "pending";

  return (
    <div className={`tx-card tx-${status}`}>
      <div className="tx-shimmer" />

      {/* Header */}
      <div className="tx-header">
        <div className="tx-badges">
          <span className="tx-id">#{tx.id}</span>
          <span className={`tx-badge badge-${status}`}>
            {status === "executed" && <><CheckCircle2 size={9} /> Executed</>}
            {status === "ready" && <><Zap size={9} /> Ready</>}
            {status === "pending" && <><span className="pulse-dot" /> Pending</>}
          </span>
        </div>
        <span className="tx-value">{parseFloat(tx.value).toFixed(4)} <span className="tx-eth">ETH</span></span>
      </div>

      {/* Destination */}
      <div className="tx-to">
        <span className="tx-to-label">TO</span>
        <span className="tx-to-addr">{short(tx.to)}</span>
        <CopyBtn text={tx.to} />
      </div>

      {/* Approval bar */}
      <div className="tx-approvals">
        <div className="tx-approvals-row">
          <span className="tx-approvals-label">Signatures</span>
          <span className="tx-approvals-count">{tx.approvalCount}<span className="tx-approvals-req">/{required}</span></span>
        </div>
        <div className="approval-track">
          <div
            className={`approval-fill fill-${status}`}
            style={{ width: `${pct}%` }}
          />
          {Array.from({ length: required }).map((_, i) => (
            <div
              key={i}
              className={`approval-pip ${i < tx.approvalCount ? "pip-filled" : ""}`}
              style={{ left: `${((i + 1) / required) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Calldata */}
      {tx.data && tx.data !== "0x" && (
        <div className="tx-calldata">
          <button onClick={() => setExpanded(e => !e)} className="calldata-toggle">
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            <span>calldata</span>
          </button>
          {expanded && <div className="calldata-body">{tx.data}</div>}
        </div>
      )}

      {/* Actions */}
      {!tx.executed && isOwner && (
        <div className="tx-actions">
          {!tx.approvedByMe ? (
            <button onClick={() => act(onApprove)} disabled={busy} className="btn-approve">
              <CheckCircle2 size={11} />
              <span>Approve</span>
            </button>
          ) : (
            <button onClick={() => act(onRevoke)} disabled={busy} className="btn-revoke">
              <XCircle size={11} />
              <span>Revoke</span>
            </button>
          )}
          {ready && (
            <button onClick={() => act(onExecute)} disabled={busy} className="btn-execute">
              <Play size={11} />
              <span>Execute</span>
            </button>
          )}
        </div>
      )}

      {tx.executed && (
        <div className="tx-done">
          <CheckCircle2 size={11} />
          <span>Transaction executed successfully</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Submit Form
// ─────────────────────────────────────────────────────────────
function SubmitForm({ onSubmit, disabled }: {
  onSubmit: (to: string, val: string, data: string) => Promise<void>; disabled: boolean;
}) {
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

  return (
    <div className="submit-form">
      <div className="form-header">
        <Send size={12} />
        <span>Propose Transaction</span>
      </div>

      <div className="field">
        <label className="field-label">Recipient</label>
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="0x…"
          className="field-input"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Value (ETH)</label>
          <input
            type="number" min="0" step="0.001" value={val}
            onChange={e => setVal(e.target.value)}
            className="field-input"
          />
        </div>
        <div className="field">
          <label className="field-label">Calldata</label>
          <input
            value={data}
            onChange={e => setData(e.target.value)}
            placeholder="0x"
            className="field-input"
          />
        </div>
      </div>

      <button
        onClick={handle}
        disabled={disabled || busy || !to.trim()}
        className="btn-submit"
      >
        <span>{busy ? "Broadcasting…" : "Submit Transaction"}</span>
        <Send size={13} />
      </button>
    </div>
  );
}

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

  return (
    <>
      <style>{CSS}</style>

      {/* ── Background ── */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="logo-icon">
            <Lock size={14} />
          </div>
          <div className="logo-text">
            <span className="logo-name">BitRealm</span>
            <span className="logo-sub">MultiSig Vault</span>
          </div>
        </div>

        <div className="topbar-right">
          {wallet.address && (
            <button onClick={ms.refresh} disabled={ms.loading} className="icon-btn" title="Refresh">
              <RefreshCw size={13} className={ms.loading ? "spin" : ""} />
            </button>
          )}

          {wallet.address ? (
            <>
              <div className="wallet-pill">
                <span className="wallet-dot" />
                <span className="wallet-addr">{short(wallet.address)}</span>
                {wallet.chainId && <span className="chain-badge">#{wallet.chainId}</span>}
                {isOwner && <span className="owner-badge">owner</span>}
              </div>
              <button onClick={wallet.disconnect} className="icon-btn" title="Disconnect">
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-connect">
              <Wallet size={13} />
              <span>{wallet.connecting ? "Connecting…" : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {!wallet.address ? (
          /* ── Landing ── */
          <div className="landing">
            <div className="landing-hero">
              <div className="hero-icon">
                <Lock size={32} />
                <div className="hero-ring hero-ring-1" />
                <div className="hero-ring hero-ring-2" />
              </div>
              <h1 className="hero-title">BitRealm<br /><span className="hero-accent">MultiSig</span></h1>
              <p className="hero-desc">
                M-of-N multi-signature vault protocol. Owners submit transactions,
                sign independently, and execution triggers at threshold.
              </p>
              <code className="hero-contract">0x5FbDB2315678afecb367f032d93F642f64180aa3</code>
              <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-connect-hero">
                <Wallet size={16} />
                <span>{wallet.connecting ? "Connecting…" : "Connect MetaMask"}</span>
              </button>
              {wallet.error && <p className="hero-error">{wallet.error}</p>}
            </div>

            <div className="steps-grid">
              {[
                { n: "01", icon: <Send size={18} />, title: "Submit", desc: "Any owner proposes a transaction with recipient, ETH value, and optional calldata." },
                { n: "02", icon: <ShieldCheck size={18} />, title: "Approve", desc: "Each owner independently approves or revokes until M signatures are collected." },
                { n: "03", icon: <Zap size={18} />, title: "Execute", desc: "Any owner triggers execution once the threshold is met. Calldata runs on-chain." },
              ].map((s, i) => (
                <div key={s.n} className="step-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <p className="step-title">{s.title}</p>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── Dashboard ── */
          <div className="dashboard">

            {/* Stats */}
            <div className="stats-row">
              <StatCard icon={<Users size={15} />} label="Owners" value={ms.owners.length || "—"} accent="#a78bfa" />
              <StatCard icon={<ShieldCheck size={15} />} label="Threshold" value={ms.required || "—"} sub={ms.owners.length ? ` / ${ms.owners.length}` : ""} accent="#f59e0b" />
              <StatCard icon={<Hash size={15} />} label="Total TXs" value={ms.txs.length} sub={pendingCount > 0 ? `  ${pendingCount} pending` : ""} accent="#34d399" />
            </div>

            {/* Non-owner notice */}
            {!isOwner && wallet.address && ms.owners.length > 0 && (
              <div className="notice-warn">
                <AlertTriangle size={13} />
                <span>Connected wallet is not an owner — read-only mode.</span>
              </div>
            )}

            {/* Grid */}
            <div className="dashboard-grid">

              {/* Left */}
              <div className="left-col">
                {isOwner
                  ? <SubmitForm onSubmit={ms.submit} disabled={!wallet.signer} />
                  : (
                    <div className="locked-panel">
                      <Lock size={22} />
                      <p>Only owners can propose transactions.</p>
                    </div>
                  )
                }

                {/* Owners */}
                <div className="owners-panel">
                  <div className="panel-header">
                    <Users size={12} />
                    <span>Owners</span>
                    <span className="panel-count">{ms.owners.length}</span>
                  </div>

                  {ms.owners.length === 0 ? (
                    <div className="owners-skeleton">
                      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 32, marginBottom: 6 }} />)}
                    </div>
                  ) : (
                    <div className="owners-list">
                      {ms.owners.map(o => {
                        const me = wallet.address?.toLowerCase() === o.toLowerCase();
                        return (
                          <div key={o} className={`owner-row ${me ? "owner-me" : ""}`}>
                            <span className={`owner-dot ${me ? "owner-dot-me" : ""}`} />
                            <span className="owner-addr">{short(o)}</span>
                            <CopyBtn text={o} />
                            {me && <span className="you-tag">you</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {ms.required > 0 && (
                    <p className="threshold-note">
                      Requires <strong>{ms.required}</strong> of {ms.owners.length} signatures
                    </p>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="right-col">
                <div className="filters-row">
                  {(["all", "pending", "executed"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`filter-btn ${filter === f ? "filter-active" : ""}`}>
                      {f}
                      {f === "pending" && pendingCount > 0 && (
                        <span className="pending-badge">{pendingCount}</span>
                      )}
                    </button>
                  ))}
                  {ms.loading && (
                    <span className="syncing-label">
                      <RefreshCw size={10} className="spin" /> syncing
                    </span>
                  )}
                </div>

                {ms.loading && ms.txs.length === 0 && (
                  <div className="tx-skeleton-grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
                  </div>
                )}

                {!ms.loading && filtered.length === 0 && (
                  <div className="empty-state">
                    <Hash size={32} />
                    <p>{filter === "all" ? "No transactions yet." : `No ${filter} transactions.`}</p>
                    {filter === "all" && isOwner && <span>Use the form to propose one.</span>}
                  </div>
                )}

                {filtered.length > 0 && (
                  <div className="tx-grid">
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

      {ms.success && <Toast msg={ms.success} type="ok" onClose={ms.clearToasts} />}
      {ms.error && <Toast msg={ms.error} type="err" onClose={ms.clearToasts} />}
      {wallet.error && !ms.error && <Toast msg={wallet.error} type="err" onClose={() => {}} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b12;
    --surface-1: #0d1120;
    --surface-2: #111827;
    --surface-3: #161e30;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.12);
    --text: #f0f4ff;
    --text-2: #8893b0;
    --text-3: #4d5a78;
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.15);
    --amber-glow: rgba(245,158,11,0.25);
    --violet: #a78bfa;
    --violet-dim: rgba(167,139,250,0.12);
    --green: #34d399;
    --green-dim: rgba(52,211,153,0.12);
    --red: #f87171;
    --red-dim: rgba(248,113,113,0.12);
    --radius: 14px;
    --radius-sm: 9px;
    --font: 'Syne', sans-serif;
    --mono: 'JetBrains Mono', monospace;
  }

  html, body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; overflow-x: hidden; }

  /* ── Background ── */
  .bg-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
  }
  .bg-orb {
    position: fixed; z-index: 0; pointer-events: none; border-radius: 50%;
    filter: blur(80px); opacity: 0.18;
  }
  .bg-orb-1 { width: 600px; height: 400px; background: radial-gradient(circle, #a78bfa, transparent 70%); top: -100px; left: -150px; }
  .bg-orb-2 { width: 500px; height: 350px; background: radial-gradient(circle, #f59e0b, transparent 70%); top: 200px; right: -150px; }

  /* ── Topbar ── */
  .topbar {
    position: sticky; top: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 60px;
    background: rgba(8,11,18,0.85);
    backdrop-filter: blur(20px) saturate(1.5);
    border-bottom: 1px solid var(--border);
  }
  .topbar-logo { display: flex; align-items: center; gap: 11px; }
  .logo-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #f59e0b22, #a78bfa22);
    border: 1px solid rgba(245,158,11,0.25);
    display: flex; align-items: center; justify-content: center;
    color: var(--amber);
    box-shadow: 0 0 20px rgba(245,158,11,0.15);
  }
  .logo-name { display: block; font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: .01em; line-height: 1.2; }
  .logo-sub { display: block; font-size: 10px; color: var(--text-3); font-family: var(--mono); letter-spacing: .08em; text-transform: uppercase; }

  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .wallet-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 30px;
    background: var(--surface-2); border: 1px solid var(--border-bright);
    font-size: 12px; font-family: var(--mono); color: var(--text-2);
  }
  .wallet-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); flex-shrink: 0; }
  .wallet-addr { color: var(--text); }
  .chain-badge {
    font-size: 10px; padding: 2px 7px; border-radius: 5px;
    background: var(--surface-3); border: 1px solid var(--border); color: var(--text-3);
  }
  .owner-badge {
    font-size: 10px; padding: 2px 7px; border-radius: 5px;
    background: var(--amber-dim); border: 1px solid rgba(245,158,11,0.3); color: var(--amber);
    font-family: var(--mono);
  }

  .icon-btn {
    width: 34px; height: 34px; border-radius: 9px; cursor: pointer;
    border: 1px solid var(--border); background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3); transition: color .15s, border-color .15s, background .15s;
  }
  .icon-btn:hover { color: var(--text); border-color: var(--border-bright); background: var(--surface-3); }

  .btn-connect {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 9px; cursor: pointer;
    border: 1px solid rgba(245,158,11,0.35); background: var(--amber-dim);
    color: var(--amber); font-size: 13px; font-weight: 600; font-family: var(--font);
    transition: all .15s; white-space: nowrap;
  }
  .btn-connect:hover { background: var(--amber-glow); box-shadow: 0 0 20px rgba(245,158,11,0.2); }
  .btn-connect:disabled { opacity: 0.5; }

  /* ── Main ── */
  .main { max-width: 1060px; margin: 0 auto; padding: 28px 24px; position: relative; z-index: 1; }

  /* ── Landing ── */
  .landing { display: flex; flex-direction: column; align-items: center; gap: 56px; padding-top: 60px; }
  .landing-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }

  .hero-icon {
    position: relative; width: 88px; height: 88px;
    display: flex; align-items: center; justify-content: center;
    color: var(--amber); margin-bottom: 8px;
  }
  .hero-icon > svg { position: relative; z-index: 2; filter: drop-shadow(0 0 16px var(--amber)); }
  .hero-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(245,158,11,0.25);
    animation: ring-pulse 3s ease-in-out infinite;
  }
  .hero-ring-1 { animation-delay: 0s; }
  .hero-ring-2 { animation-delay: 1s; transform: scale(1.35); border-color: rgba(167,139,250,0.2); }
  @keyframes ring-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  .hero-title { font-size: 52px; font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: var(--text); }
  .hero-accent { background: linear-gradient(135deg, var(--amber), var(--violet)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-desc { font-size: 15px; color: var(--text-2); max-width: 400px; line-height: 1.75; font-weight: 400; }
  .hero-contract {
    font-family: var(--mono); font-size: 11px; color: var(--text-3);
    padding: 8px 16px; border-radius: 8px;
    background: var(--surface-2); border: 1px solid var(--border);
  }

  .btn-connect-hero {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 28px; border-radius: 12px; cursor: pointer;
    background: linear-gradient(135deg, var(--amber), #d97706);
    border: none; color: #000; font-size: 15px; font-weight: 700; font-family: var(--font);
    box-shadow: 0 0 40px rgba(245,158,11,0.3), 0 4px 20px rgba(0,0,0,0.4);
    transition: transform .15s, box-shadow .15s; margin-top: 8px;
  }
  .btn-connect-hero:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(245,158,11,0.4), 0 8px 30px rgba(0,0,0,0.5); }
  .btn-connect-hero:disabled { opacity: 0.5; transform: none; }
  .hero-error { font-family: var(--mono); font-size: 12px; color: var(--red); margin-top: 4px; }

  .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; width: 100%; max-width: 680px; }
  .step-card {
    position: relative; padding: 22px 20px;
    background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; animation: fade-up .4s ease-out both;
  }
  .step-card::before {
    content: ''; position: absolute; inset: 0; border-radius: var(--radius);
    background: linear-gradient(135deg, rgba(245,158,11,0.04), rgba(167,139,250,0.04));
  }
  .step-num { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-bottom: 14px; }
  .step-icon { color: var(--amber); margin-bottom: 12px; }
  .step-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .step-desc { font-size: 12px; color: var(--text-2); line-height: 1.65; font-weight: 400; }

  /* ── Dashboard ── */
  .dashboard { display: flex; flex-direction: column; gap: 20px; }

  .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .stat-card {
    position: relative; overflow: hidden;
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border-radius: var(--radius);
    background: var(--surface-1); border: 1px solid var(--border);
    transition: border-color .2s;
  }
  .stat-card:hover { border-color: var(--border-bright); }
  .stat-icon-wrap {
    width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
    display: flex; align-items: center; justify-content: center;
    color: var(--accent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .stat-body { flex: 1; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: var(--text-3); margin-bottom: 4px; font-weight: 500; }
  .stat-value { font-family: var(--mono); font-size: 28px; font-weight: 500; color: var(--text); line-height: 1; }
  .stat-sub { font-size: 13px; color: var(--text-3); margin-left: 3px; font-weight: 400; }
  .stat-glow {
    position: absolute; right: -20px; top: -20px;
    width: 80px; height: 80px; border-radius: 50%;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    filter: blur(20px); pointer-events: none;
  }

  /* Notice */
  .notice-warn {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border-radius: var(--radius-sm);
    background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
    font-size: 12px; color: var(--amber); font-weight: 500;
  }

  /* Dashboard grid */
  .dashboard-grid { display: grid; grid-template-columns: 230px 1fr; gap: 16px; align-items: start; }
  .left-col { display: flex; flex-direction: column; gap: 12px; }
  .right-col { display: flex; flex-direction: column; gap: 14px; }

  /* ── Submit Form ── */
  .submit-form {
    background: var(--surface-1); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px;
  }
  .form-header {
    display: flex; align-items: center; gap: 7px; margin-bottom: 14px;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3);
  }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field-label { font-size: 11px; color: var(--text-3); font-weight: 500; letter-spacing: .04em; }
  .field-input {
    padding: 8px 10px; border-radius: var(--radius-sm);
    background: var(--surface-3); border: 1px solid var(--border);
    color: var(--text); font-family: var(--mono); font-size: 11px; outline: none;
    transition: border-color .15s;
  }
  .field-input:focus { border-color: rgba(245,158,11,0.4); }
  .field-input::placeholder { color: var(--text-3); }

  .btn-submit {
    width: 100%; padding: 10px; border-radius: 9px; cursor: pointer;
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(167,139,250,0.1));
    border: 1px solid rgba(245,158,11,0.3); color: var(--amber);
    font-size: 12px; font-weight: 700; font-family: var(--font);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all .15s; margin-top: 4px;
  }
  .btn-submit:hover:not(:disabled) { background: var(--amber-glow); box-shadow: 0 0 20px rgba(245,158,11,0.15); }
  .btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Locked panel */
  .locked-panel {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 28px 16px; border-radius: var(--radius);
    background: var(--surface-1); border: 1px solid var(--border);
    color: var(--text-3); font-size: 12px; text-align: center; line-height: 1.6;
  }

  /* Owners Panel */
  .owners-panel {
    background: var(--surface-1); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px;
  }
  .panel-header {
    display: flex; align-items: center; gap: 7px; margin-bottom: 12px;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3);
  }
  .panel-count {
    margin-left: auto; font-family: var(--mono); font-size: 12px;
    color: var(--text-2); background: var(--surface-3); border: 1px solid var(--border);
    border-radius: 6px; padding: 1px 7px;
  }
  .owners-list { display: flex; flex-direction: column; gap: 5px; }
  .owner-row {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; border-radius: 8px; font-size: 11px; font-family: var(--mono);
    border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2);
    transition: border-color .15s;
  }
  .owner-row:hover { border-color: var(--border-bright); }
  .owner-me { border-color: rgba(245,158,11,0.25) !important; background: var(--amber-dim); color: var(--amber); }
  .owner-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-3); flex-shrink: 0; }
  .owner-dot-me { background: var(--amber); box-shadow: 0 0 6px var(--amber); }
  .owner-addr { flex: 1; }
  .you-tag {
    font-size: 9px; padding: 1px 5px; border-radius: 4px;
    background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.3); color: var(--amber);
  }
  .threshold-note {
    font-size: 11px; color: var(--text-3); margin-top: 12px; padding-top: 12px;
    border-top: 1px solid var(--border); line-height: 1.5;
  }
  .threshold-note strong { color: var(--text); }

  /* ── Filters ── */
  .filters-row { display: flex; align-items: center; gap: 6px; }
  .filter-btn {
    padding: 5px 14px; border-radius: 7px; cursor: pointer;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; font-family: var(--font);
    border: 1px solid var(--border); background: var(--surface-2); color: var(--text-3);
    transition: all .15s;
  }
  .filter-btn:hover { color: var(--text); border-color: var(--border-bright); }
  .filter-active { border-color: rgba(245,158,11,0.35) !important; background: var(--amber-dim) !important; color: var(--amber) !important; }
  .pending-badge {
    margin-left: 5px; background: var(--amber); color: #000;
    border-radius: 10px; padding: 0 5px; font-size: 10px; font-weight: 700;
  }
  .syncing-label {
    margin-left: auto; font-size: 11px; color: var(--text-3); display: flex; align-items: center; gap: 5px;
    font-family: var(--mono);
  }

  /* ── TX Grid ── */
  .tx-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tx-skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── TX Card ── */
  .tx-card {
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; gap: 10px;
    padding: 14px 15px; border-radius: var(--radius);
    background: var(--surface-1); border: 1px solid var(--border);
    transition: border-color .2s, transform .15s;
  }
  .tx-card:hover { transform: translateY(-1px); }
  .tx-executed { border-color: rgba(52,211,153,0.2); }
  .tx-ready { border-color: rgba(167,139,250,0.25); }

  .tx-shimmer {
    position: absolute; inset: 0; pointer-events: none; border-radius: var(--radius);
    background: linear-gradient(135deg, rgba(255,255,255,0.02), transparent 60%);
  }

  .tx-header { display: flex; align-items: center; justify-content: space-between; }
  .tx-badges { display: flex; align-items: center; gap: 6px; }
  .tx-id {
    font-family: var(--mono); font-size: 10px; padding: 2px 7px;
    border-radius: 5px; border: 1px solid var(--border);
    color: var(--text-3); background: var(--surface-2);
  }
  .tx-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 5px;
    display: flex; align-items: center; gap: 4px; font-weight: 600;
  }
  .badge-executed { border: 1px solid rgba(52,211,153,0.3); background: var(--green-dim); color: var(--green); }
  .badge-ready { border: 1px solid rgba(167,139,250,0.3); background: var(--violet-dim); color: var(--violet); }
  .badge-pending { border: 1px solid rgba(245,158,11,0.25); background: var(--amber-dim); color: var(--amber); }

  .pulse-dot {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: var(--amber); animation: dot-pulse 1.5s ease-in-out infinite;
  }
  @keyframes dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  .tx-value { font-family: var(--mono); font-size: 15px; font-weight: 500; color: var(--text); }
  .tx-eth { font-size: 11px; color: var(--text-3); }

  .tx-to {
    display: flex; align-items: center; gap: 7px; font-size: 11px;
    padding: 6px 9px; border-radius: 7px; background: var(--surface-2);
  }
  .tx-to-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--text-3); }
  .tx-to-addr { font-family: var(--mono); color: var(--text-2); flex: 1; }

  .tx-approvals { display: flex; flex-direction: column; gap: 6px; }
  .tx-approvals-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
  .tx-approvals-label { color: var(--text-3); }
  .tx-approvals-count { font-family: var(--mono); font-size: 12px; font-weight: 500; color: var(--text); }
  .tx-approvals-req { color: var(--text-3); }

  .approval-track {
    position: relative; height: 4px; border-radius: 2px; background: var(--surface-3);
  }
  .approval-fill {
    height: 100%; border-radius: 2px;
    transition: width .4s cubic-bezier(.4,0,.2,1), background .3s;
  }
  .fill-executed { background: linear-gradient(90deg, var(--green), #10b981); }
  .fill-ready { background: linear-gradient(90deg, var(--violet), #8b5cf6); box-shadow: 0 0 8px rgba(167,139,250,0.5); }
  .fill-pending { background: linear-gradient(90deg, var(--amber), #d97706); }

  .approval-pip {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--surface-3); border: 1px solid var(--border);
    transition: background .3s, border-color .3s;
  }
  .pip-filled { background: var(--amber); border-color: var(--amber); box-shadow: 0 0 6px var(--amber-glow); }

  /* Calldata */
  .tx-calldata { display: flex; flex-direction: column; gap: 5px; }
  .calldata-toggle {
    background: none; border: none; cursor: pointer; font-size: 10px;
    color: var(--text-3); display: flex; align-items: center; gap: 4px;
    font-family: var(--mono); padding: 0; transition: color .15s;
  }
  .calldata-toggle:hover { color: var(--text-2); }
  .calldata-body {
    font-size: 10px; font-family: var(--mono); color: var(--text-3);
    background: var(--surface-2); border-radius: 7px; padding: 8px 10px;
    word-break: break-all; line-height: 1.65;
    border: 1px solid var(--border);
  }

  /* TX Actions */
  .tx-actions { display: flex; gap: 7px; margin-top: 2px; }
  .btn-approve, .btn-revoke, .btn-execute {
    flex: 1; padding: 7px 0; border-radius: 8px; cursor: pointer;
    font-size: 11px; font-weight: 600; font-family: var(--font);
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: all .15s;
  }
  .btn-approve { border: 1px solid rgba(167,139,250,0.3); background: var(--violet-dim); color: var(--violet); }
  .btn-approve:hover:not(:disabled) { background: rgba(167,139,250,0.2); box-shadow: 0 0 16px rgba(167,139,250,0.15); }
  .btn-revoke { border: 1px solid rgba(248,113,113,0.3); background: var(--red-dim); color: var(--red); }
  .btn-revoke:hover:not(:disabled) { background: rgba(248,113,113,0.2); }
  .btn-execute { border: 1px solid rgba(52,211,153,0.3); background: var(--green-dim); color: var(--green); }
  .btn-execute:hover:not(:disabled) { background: rgba(52,211,153,0.2); box-shadow: 0 0 16px rgba(52,211,153,0.15); }
  .btn-approve:disabled, .btn-revoke:disabled, .btn-execute:disabled { opacity: 0.4; cursor: not-allowed; }

  .tx-done {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--green); font-weight: 500;
  }

  /* ── Empty State ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 60px 20px;
    background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius);
    color: var(--text-3); font-size: 14px; text-align: center;
  }
  .empty-state svg { opacity: 0.2; }
  .empty-state span { font-size: 12px; opacity: 0.6; }

  /* ── Copy Btn ── */
  .copy-btn {
    background: none; border: none; cursor: pointer; padding: 0 2px;
    color: inherit; opacity: 0.4; transition: opacity .15s; line-height: 1;
  }
  .copy-btn:hover { opacity: 0.9; }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    max-width: 380px; display: flex; align-items: flex-start; gap: 10px;
    padding: 13px 15px; border-radius: 12px; font-size: 12px; font-family: var(--mono);
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    animation: toast-in .25s cubic-bezier(.4,0,.2,1);
    backdrop-filter: blur(12px);
  }
  .toast-ok { border: 1px solid rgba(52,211,153,0.3); background: rgba(17,24,39,0.95); color: var(--green); }
  .toast-err { border: 1px solid rgba(248,113,113,0.3); background: rgba(17,24,39,0.95); color: var(--red); }
  .toast-icon { margin-top: 1px; flex-shrink: 0; }
  .toast-msg { flex: 1; word-break: break-all; line-height: 1.6; }
  .toast-close { background: none; border: none; cursor: pointer; opacity: 0.4; color: inherit; transition: opacity .15s; }
  .toast-close:hover { opacity: 0.9; }

  /* ── Skeleton ── */
  .skeleton {
    border-radius: 10px;
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Animations ── */
  @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes toast-in { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }

  .fade-up { animation: fade-up .35s ease-out both; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;