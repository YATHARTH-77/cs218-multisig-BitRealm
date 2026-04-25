// src/hooks/useWallet.ts
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

  const fetchBalance = async (provider: BrowserProvider, address: string) => {
    try {
      const rawBalance = await provider.getBalance(address);
      return parseFloat(formatEther(rawBalance)).toFixed(4);
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0.0000";
    }
  };

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState((s) => ({ ...s, error: "MetaMask not found. Please install it." }));
      return;
    }
    
    setState((s) => ({ ...s, connecting: true, error: null }));
    
    try {
      const eth = (window as any).ethereum;
      const provider = new BrowserProvider(eth);
      
      // Request connection
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await fetchBalance(provider, address);

      setState({
        provider,
        signer,
        address,
        balance,
        chainId: Number(network.chainId),
        connecting: false,
        error: null,
      });

      // Listen for account changes
      eth.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length > 0) {
            const newSigner = await provider.getSigner();
            const newAddress = accounts[0];
            const newBalance = await fetchBalance(provider, newAddress);
            setState((s) => ({ ...s, signer: newSigner, address: newAddress, balance: newBalance }));
        } else {
            disconnect();
        }
      });

      // Listen for chain changes
      eth.on("chainChanged", () => {
        window.location.reload();
      });

    } catch (err: any) {
      setState((s) => ({ ...s, connecting: false, error: err?.message ?? "Connection failed" }));
    }
  }, []);

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

  return { ...state, connect, disconnect };
}