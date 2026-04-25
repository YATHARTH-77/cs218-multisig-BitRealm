"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Contract,
  parseEther,
  formatEther,
  JsonRpcSigner,
  BrowserProvider,
} from "ethers";
import { MULTISIG_ABI, CONTRACT_ADDRESS } from "@/lib/contract";

/* ───────────── TYPES ───────────── */
export type Tx = {
  id: number;
  to: string;
  value: string;
  data: string;
  executed: boolean;
  approvalCount: number;
  approvedByMe: boolean;
  hash?: string;
  blockNumber?: number;
};

/* ───────────── LOCAL STORAGE ───────────── */
function loadTxMeta(): Record<number, { hash: string; blockNumber: number }> {
  try {
    return JSON.parse(localStorage.getItem("txMeta") || "{}");
  } catch {
    return {};
  }
}

function saveTxMeta(meta: Record<number, { hash: string; blockNumber: number }>) {
  localStorage.setItem("txMeta", JSON.stringify(meta));
}

/* ───────────── HOOK ───────────── */
export function useMultisig(
  signer: JsonRpcSigner | null,
  provider: BrowserProvider | null
) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [required, setRequired] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState<string>("0");

  const successTimeout = useRef<NodeJS.Timeout | null>(null);
  const errorTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!provider) return;

    const updateBalance = async () => {
      const bal = await provider.getBalance(CONTRACT_ADDRESS);
      setBalance(formatEther(bal));
    };

    updateBalance();

    provider.on("block", updateBalance);

    return () => {
      provider.off("block", updateBalance);
    };
  }, [provider]);

  /* ───────────── CONTRACT ───────────── */
  function getContract(write = false) {
    if (!provider) throw new Error("No provider");
    if (write && !signer) throw new Error("No signer");

    return new Contract(
      CONTRACT_ADDRESS,
      MULTISIG_ABI,
      write ? signer : provider
    );
  }

  async function waitForContract(provider: BrowserProvider, retries = 20) {
    for (let i = 0; i < retries; i++) {
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code !== "0x") return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Contract not deployed");
  }

  /* ───────────── TOASTS ───────────── */
  function showSuccess(msg: string) {
    setSuccess(msg);
    if (successTimeout.current) clearTimeout(successTimeout.current);
    successTimeout.current = setTimeout(() => setSuccess(null), 5000);
  }

  function showError(msg: string) {
    setError(msg);
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setError(null), 6000);
  }

  const clearToasts = () => {
    setSuccess(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (successTimeout.current) clearTimeout(successTimeout.current);
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
    };
  }, []);

  /* ───────────── REFRESH ───────────── */
  const refresh = useCallback(async () => {
    if (!provider) return;

    setLoading(true);
    setError(null);

    try {
      if (!ready) {
        await waitForContract(provider);
        setReady(true);
      }

      const c = getContract();

      const req = await c.requiredApprovals();
      setRequired(Number(req));

      const ownerList = await c.getOwners();
      setOwners(ownerList);

      const bal = await provider.getBalance(CONTRACT_ADDRESS);
      setBalance(formatEther(bal));

      const count = Number(await c.getTransactionCount());
      const userAddr = signer
        ? (await signer.getAddress()).toLowerCase()
        : null;

      const indices: number[] = [];
      for (let i = count - 1; i >= Math.max(0, count - 20); i--) {
        indices.push(i);
      }

      const list: Tx[] = await Promise.all(
        indices.map(async (i) => {
          const [to, value, data, executed, approvalCount] =
            await c.getTransaction(i);

          const approvedByMe = userAddr
            ? await c.isApproved(i, userAddr)
            : false;

          return {
            id: i,
            to,
            value: formatEther(value),
            data,
            executed,
            approvalCount: Number(approvalCount),
            approvedByMe,
          };
        })
      );

      const meta = loadTxMeta();

      const merged = list.map((t) => ({
        ...t,
        hash: meta[t.id]?.hash,
        blockNumber: meta[t.id]?.blockNumber,
      }));

      setTxs(merged);
    } catch (e: any) {
      setError(e?.reason ?? e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [provider, signer, ready]);

  /* ───────────── ACTIONS ───────────── */
  const submit = useCallback(async (to: string, ethVal: string, data: string) => {
    if (!signer) return;
    clearToasts();

    try {
      const c = getContract(true);
      const tx = await c.submitTransaction(
        to,
        parseEther(ethVal || "0"),
        data || "0x"
      );
      await tx.wait();

      showSuccess("Transaction submitted!");
      await refresh();
    } catch (e: any) {
      showError(e?.message || "Submit failed");
    }
  }, [signer, refresh]);

  const approve = useCallback(async (id: number) => {
    if (!signer) return;
    clearToasts();

    try {
      const c = getContract(true);
      const tx = await c.approveTransaction(id);
      await tx.wait();

      showSuccess(`Approved tx #${id}`);
      await refresh();
    } catch (e: any) {
      showError(e?.message || "Approve failed");
    }
  }, [signer, refresh]);

  const revoke = useCallback(async (id: number) => {
    if (!signer) return;
    clearToasts();

    try {
      const c = getContract(true);
      const tx = await c.revokeApproval(id);
      await tx.wait();

      showSuccess(`Revoked tx #${id}`);
      await refresh();
    } catch (e: any) {
      showError(e?.message || "Revoke failed");
    }
  }, [signer, refresh]);

  const execute = useCallback(async (id: number) => {
    if (!signer) return;
    clearToasts();

    try {
      const c = getContract(true);
      const tx = await c.executeTransaction(id);
      const receipt = await tx.wait();

      const meta = loadTxMeta();
      meta[id] = {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
      saveTxMeta(meta);

      setTxs((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                executed: true,
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
              }
            : t
        )
      );

      showSuccess(`Executed tx #${id}!`);
    } catch (e: any) {
      showError(e?.message || "Execute failed");
    }
  }, [signer]);

  /* ───────────── RETURN ───────────── */
  return {
    txs,
    owners,
    required,
    loading,
    success,
    error,
    clearToasts,
    refresh,
    submit,
    approve,
    revoke,
    execute,
    balance,
  };
}