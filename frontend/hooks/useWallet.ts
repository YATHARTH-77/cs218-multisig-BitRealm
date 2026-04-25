"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";

export type WalletState = {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    balance: null,
    chainId: null,
    connecting: false,
    error: null,
  });

  // --- Handle chain/account changes + auto reconnect ---
  useEffect(() => {
    if (!(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleChainChanged = () => {
      window.location.reload(); // safest approach
    };

    const handleAccountsChanged = () => {
      window.location.reload();
    };

    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("accountsChanged", handleAccountsChanged);

    // --- Auto reconnect if already authorized ---
    const reconnect = async () => {
      try {
        const provider = new BrowserProvider(ethereum);
        const accounts = await provider.send("eth_accounts", []);

        if (accounts.length === 0) return;

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const rawBalance = await provider.getBalance(address);
        const balance = parseFloat(formatEther(rawBalance)).toFixed(4);

        const network = await provider.getNetwork();

        setState({
          provider,
          signer,
          address,
          balance,
          chainId: Number(network.chainId),
          connecting: false,
          error: null,
        });
      } catch (err) {
        console.error("Auto reconnect failed", err);
      }
    };

    reconnect();

    return () => {
      ethereum.removeListener("chainChanged", handleChainChanged);
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // --- Connect wallet manually ---
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState((s) => ({
        ...s,
        error: "MetaMask not found. Please install it.",
      }));
      return;
    }

    setState((s) => ({ ...s, connecting: true, error: null }));

    try {
      const provider = new BrowserProvider((window as any).ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const rawBalance = await provider.getBalance(address);
      const balance = parseFloat(formatEther(rawBalance)).toFixed(4);

      const network = await provider.getNetwork();

      setState({
        provider,
        signer,
        address,
        balance,
        chainId: Number(network.chainId),
        connecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err?.message ?? "Connection failed",
      }));
    }
  }, []);

  // --- Disconnect ---
  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      address: null,
      balance: null,
      chainId: null,
      connecting: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}