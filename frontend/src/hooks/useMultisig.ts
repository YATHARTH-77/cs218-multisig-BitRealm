// src/hooks/useMultisig.ts
"use client";
import { useState, useCallback } from "react";
import { Contract, BrowserProvider, JsonRpcSigner, formatEther } from "ethers";
import { MULTISIG_ABI, CONTRACT_ADDRESS } from "../lib/contract";

export type Tx = {
  id: number;
  to: string;
  value: string;
  data: string;
  executed: boolean;
  approvalCount: number;
  approvedByMe: boolean; // Computed specifically for the connected user
};

export function useMultisig(
  signer: JsonRpcSigner | null,
  provider: BrowserProvider | null
) {
  const [owners, setOwners] = useState<string[]>([]);
  const [required, setRequired] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearToasts = () => {
    setError(null);
    setSuccess(null);
  };

  const getContract = useCallback(() => {
    if (signer) return new Contract(CONTRACT_ADDRESS, MULTISIG_ABI, signer);
    if (provider) return new Contract(CONTRACT_ADDRESS, MULTISIG_ABI, provider);
    return null;
  }, [signer, provider]);

  const refresh = useCallback(async () => {
    const contract = getContract();
    if (!contract) return;

    setLoading(true);
    clearToasts();

    try {
      // Fetch Contract Config
      const req = await contract.requiredApprovals();
      setRequired(Number(req));

      // Fetch Owners array manually until it reverts
      const fetchedOwners: string[] = [];
      let i = 0;
      while (true) {
        try {
          const owner = await contract.owners(i);
          fetchedOwners.push(owner);
          i++;
        } catch {
          break; // Hit the end of the array
        }
      }
      setOwners(fetchedOwners);

      // Fetch Transactions
      const countRaw = await contract.getTransactionCount();
      const count = Number(countRaw);
      
      const fetchedTxs: Tx[] = [];
      const userAddress = signer ? await signer.getAddress() : null;

      for (let j = count - 1; j >= 0; j--) { // Reverse loop to show newest first
        const t = await contract.getTransaction(j);
        let approvedByMe = false;
        
        if (userAddress) {
           const approvers = await contract.getApprovers(j);
           approvedByMe = approvers.includes(userAddress);
        }

        fetchedTxs.push({
          id: j,
          to: t.to,
          value: formatEther(t.value),
          data: t.data,
          executed: t.executed,
          approvalCount: Number(t.approvalCount),
          approvedByMe,
        });
      }
      setTxs(fetchedTxs);
    } catch (err: any) {
      console.error("Refresh error:", err);
      setError("Failed to fetch contract data. Is Hardhat running?");
    } finally {
      setLoading(false);
    }
  }, [getContract, signer]);

  // Write Functions
  const submit = async (to: string, valEth: string, data: string) => {
    const contract = getContract();
    if (!contract || !signer) return;
    try {
      clearToasts();
      const tx = await contract.submitTransaction(to, BigInt(parseFloat(valEth) * 1e18), data);
      setSuccess("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setSuccess("Transaction confirmed!");
      await refresh();
    } catch (err: any) {
      setError(err?.reason || "Submission failed");
    }
  };

  const approve = async (id: number) => {
    const contract = getContract();
    if (!contract || !signer) return;
    try {
      clearToasts();
      const tx = await contract.approveTransaction(id);
      setSuccess("Approval submitted...");
      await tx.wait();
      setSuccess("Approved!");
      await refresh();
    } catch (err: any) {
      setError(err?.reason || "Approval failed");
    }
  };

  const revoke = async (id: number) => {
    const contract = getContract();
    if (!contract || !signer) return;
    try {
      clearToasts();
      const tx = await contract.revokeApproval(id);
      setSuccess("Revocation submitted...");
      await tx.wait();
      setSuccess("Revoked!");
      await refresh();
    } catch (err: any) {
      setError(err?.reason || "Revocation failed");
    }
  };

  const execute = async (id: number) => {
    const contract = getContract();
    if (!contract || !signer) return;
    try {
      clearToasts();
      const tx = await contract.executeTransaction(id);
      setSuccess("Execution submitted...");
      await tx.wait();
      setSuccess("Executed successfully!");
      await refresh();
    } catch (err: any) {
      setError(err?.reason || "Execution failed");
    }
  };

  return {
    owners,
    required,
    txs,
    loading,
    error,
    success,
    clearToasts,
    refresh,
    submit,
    approve,
    revoke,
    execute,
  };
}