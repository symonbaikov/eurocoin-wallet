"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useChains,
  useConnect,
  useDisconnect,
} from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chains";

interface UseWalletConnectionResult {
  address?: `0x${string}`;
  chainId?: number;
  connectorName?: string;
  currentChainName?: string;
  status: ReturnType<typeof useAccount>["status"];
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isDisconnecting: boolean;
  canConnect: boolean;
  connectError?: Error;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useWalletConnection(): UseWalletConnectionResult {
  const {
    address,
    chainId,
    connector,
    status,
    isConnected,
    isConnecting,
    isReconnecting,
  } = useAccount();
  const { connectAsync, connectors, isPending, error } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const chains = useChains();

  const metaMaskConnector = useMemo(
    () =>
      connectors.find(
        (item) => item.id === "io.metamask" || item.id === "metaMask" || item.name === "MetaMask",
      ),
    [connectors],
  );

  type EthereumRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  type EthereumProvider = { request: EthereumRequest };

  const injectedReady = Boolean(
    typeof window !== "undefined" &&
      (window as unknown as { ethereum?: EthereumProvider }).ethereum?.request,
  );

  const handleConnect = useCallback(async () => {
    if (!metaMaskConnector) {
      // Try fallback to injected provider request if connector isn't present yet
      if (injectedReady) {
        const eth = (window as unknown as { ethereum: EthereumProvider }).ethereum;
        await eth.request({ method: "eth_requestAccounts" });
        // Attempt network switch to required chain
        const chainIdHex = `0x${DEFAULT_CHAIN.id.toString(16)}`;
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }],
          });
        } catch (err: unknown) {
          // If the chain is unknown to MM, suggest adding (shouldn't be needed for mainnet/sepolia)
          const e = err as { code?: number } | undefined;
          if (e && e.code === 4902) {
            try {
              await eth.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: chainIdHex,
                    chainName: DEFAULT_CHAIN.name,
                    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                    rpcUrls: [location.origin],
                  },
                ],
              });
            } catch {
              // ignore
            }
          }
        }
        return;
      }

      throw new Error("MetaMask не найден. Установите расширение и включите его.");
    }

    // Preferred path via wagmi connector
    try {
      await connectAsync({
        connector: metaMaskConnector,
        chainId: DEFAULT_CHAIN.id,
      });
    } catch (primaryError) {
      // Fallback: explicitly request accounts via injected provider, then try again
      if (injectedReady) {
        const eth = (window as unknown as { ethereum: EthereumProvider }).ethereum;
        await eth.request({ method: "eth_requestAccounts" });
        try {
          await connectAsync({
            connector: metaMaskConnector,
            chainId: DEFAULT_CHAIN.id,
          });
        } catch (secondaryError) {
          throw (secondaryError as Error) ?? (primaryError as Error);
        }
      } else {
        throw primaryError as Error;
      }
    }
  }, [connectAsync, metaMaskConnector, injectedReady]);

  const handleDisconnect = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const currentChain = useMemo(
    () => chains.find((chain) => chain.id === chainId),
    [chains, chainId],
  );

  return {
    address,
    chainId,
    connectorName: connector?.name ?? metaMaskConnector?.name,
    currentChainName: currentChain?.name,
    status,
    isConnected,
    isConnecting: isConnecting || isPending,
    isReconnecting,
    isDisconnecting,
    canConnect: Boolean(metaMaskConnector?.ready || injectedReady),
    connectError: error ?? undefined,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}
