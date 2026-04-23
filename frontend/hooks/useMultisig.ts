"use client";
import { useState, useCallback } from "react";
import { Contract, parseEther, formatEther, JsonRpcSigner, BrowserProvider } from "ethers";
import { MULTISIG_ABI, CONTRACT_ADDRESS } from "@/lib/contract";

export type Tx = {
  id: number;
  to: string;
  value: string;
  data: string;
  executed: boolean;
  approvalCount: number;
  approvedByMe: boolean;
};

export function useMultisig(signer: JsonRpcSigner | null, provider: BrowserProvider | null) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [required, setRequired] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getContract(write = false) {
    if (!provider) throw new Error("No provider");
    return new Contract(CONTRACT_ADDRESS, MULTISIG_ABI, write && signer ? signer : provider);
  }

  const clearToasts = () => { setSuccess(null); setError(null); };

  const refresh = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    setError(null);
    try {
      const c = getContract();

      const req = await c.requiredApprovals();
      setRequired(Number(req));

      // owners stored as array — fetch by index until revert
      const ownerList: string[] = [];
      for (let i = 0; ; i++) {
        try { ownerList.push(await c.owners(i) as string); }
        catch { break; }
      }
      setOwners(ownerList);

      const count = Number(await c.getTransactionCount());
      const userAddr = signer ? (await signer.getAddress()).toLowerCase() : null;

      const list: Tx[] = [];
      for (let i = count - 1; i >= Math.max(0, count - 20); i--) {
        // getTransaction returns: to, value, data, executed, approvalCount
        const [to, value, data, executed, approvalCount] = await c.getTransaction(i);
        const approvedByMe = userAddr ? Boolean(await c.isApproved(i, userAddr)) : false;
        list.push({
          id: i,
          to: to as string,
          value: formatEther(value as bigint),
          data: data as string,
          executed: executed as boolean,
          approvalCount: Number(approvalCount),
          approvedByMe,
        });
      }
      setTxs(list);
    } catch (e: any) {
      setError(e?.reason ?? e?.message ?? "Failed to load contract data");
    } finally {
      setLoading(false);
    }
  }, [provider, signer]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  }
  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 6000);
  }

  const submit = useCallback(async (to: string, ethVal: string, data: string) => {
    if (!signer) return;
    try {
      const c = getContract(true);
      const tx = await c.submitTransaction(to, parseEther(ethVal || "0"), data || "0x");
      await tx.wait();
      showSuccess(`Transaction submitted!`);
      await refresh();
    } catch (e: any) { showError(e?.reason ?? e?.message ?? "Submit failed"); }
  }, [signer, refresh]);

  const approve = useCallback(async (id: number) => {
    if (!signer) return;
    try {
      const c = getContract(true);
      const tx = await c.approveTransaction(id);
      await tx.wait();
      showSuccess(`Approved tx #${id}`);
      await refresh();
    } catch (e: any) { showError(e?.reason ?? e?.message ?? "Approve failed"); }
  }, [signer, refresh]);

  const revoke = useCallback(async (id: number) => {
    if (!signer) return;
    try {
      const c = getContract(true);
      const tx = await c.revokeApproval(id);
      await tx.wait();
      showSuccess(`Revoked approval for tx #${id}`);
      await refresh();
    } catch (e: any) { showError(e?.reason ?? e?.message ?? "Revoke failed"); }
  }, [signer, refresh]);

  const execute = useCallback(async (id: number) => {
    if (!signer) return;
    try {
      const c = getContract(true);
      const tx = await c.executeTransaction(id);
      await tx.wait();
      showSuccess(`Executed tx #${id}!`);
      await refresh();
    } catch (e: any) { showError(e?.reason ?? e?.message ?? "Execute failed"); }
  }, [signer, refresh]);

  return { txs, owners, required, loading, success, error, clearToasts, refresh, submit, approve, revoke, execute };
}