"use client";
import { useState, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";

export type WalletState = {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  balance: string | null; // <-- ADDED THIS
  chainId: number | null;
  connecting: boolean;
  error: string | null;
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    balance: null, // <-- ADDED THIS
    chainId: null,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState((s) => ({ ...s, error: "MetaMask not found. Please install it." }));
      return;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // <-- ADDED BALANCE FETCHING -->
      const rawBalance = await provider.getBalance(address);
      const balance = parseFloat(formatEther(rawBalance)).toFixed(4); // Formats to 4 decimal places
      
      const network = await provider.getNetwork();
      setState({ provider, signer, address, balance, chainId: Number(network.chainId), connecting: false, error: null });
    } catch (err: any) {
      setState((s) => ({ ...s, connecting: false, error: err?.message ?? "Connection failed" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ provider: null, signer: null, address: null, balance: null, chainId: null, connecting: false, error: null });
  }, []);

  return { ...state, connect, disconnect };
}