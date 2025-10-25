import { mainnet, sepolia } from "wagmi/chains";
import { TOKEN_CONFIG } from "@/config/token";

const AVAILABLE_CHAINS = [sepolia, mainnet] as const;

const defaultChain =
  AVAILABLE_CHAINS.find((chain) => chain.id === TOKEN_CONFIG.chainId) ??
  sepolia;

export const SUPPORTED_CHAINS = AVAILABLE_CHAINS;

export const DEFAULT_CHAIN = defaultChain;

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.id,
);
