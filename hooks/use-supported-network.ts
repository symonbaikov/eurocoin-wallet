"use client";

import { useMemo } from "react";
import {
  useAccount,
  useChainId,
  useChains,
  useSwitchChain,
} from "wagmi";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/config/chains";

interface UseSupportedNetworkResult {
  supportedChains: typeof SUPPORTED_CHAINS;
  activeChainId?: number;
  activeChainName?: string;
  unsupportedChainName?: string;
  isSupported: boolean;
  isSwitching: boolean;
  canSwitch: boolean;
  switchToChain: (chainId: number) => Promise<void>;
  switchToDefault: () => Promise<void>;
  error?: Error;
  isConnected: boolean;
}

export function useSupportedNetwork(): UseSupportedNetworkResult {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { switchChainAsync, isPending: isSwitching, error } = useSwitchChain();

  const requiredChainId = DEFAULT_CHAIN.id;

  const isSupported = chainId ? chainId === requiredChainId : true;

  const activeChain = useMemo(
    () =>
      chainId
        ? [...SUPPORTED_CHAINS, ...chains].find(
            (chain) => chain.id === chainId,
          )
        : undefined,
    [chainId, chains],
  );

  const unsupportedChainName =
    !isSupported && chainId
      ? chains.find((chain) => chain.id === chainId)?.name ?? "неизвестная сеть"
      : undefined;

  const switchToChain = async (targetChainId: number) => {
    if (!switchChainAsync) {
      throw new Error("Переключение сетей недоступно в текущей среде.");
    }

    await switchChainAsync({ chainId: targetChainId });
  };

  const switchToDefault = async () => {
    await switchToChain(requiredChainId);
  };

  return {
    supportedChains: SUPPORTED_CHAINS,
    activeChainId: chainId,
    activeChainName: activeChain?.name,
    unsupportedChainName,
    isSupported,
    isSwitching,
    canSwitch: Boolean(switchChainAsync) && isConnected,
    switchToChain,
    switchToDefault,
    error: error ?? undefined,
    isConnected,
  };
}
