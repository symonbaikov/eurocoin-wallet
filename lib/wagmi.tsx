import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/config/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const resolveTransport = (chainId: number) => {
  if (RPC_URL && chainId === DEFAULT_CHAIN.id) {
    return http(RPC_URL);
  }

  if (chainId === sepolia.id) {
    return http("https://sepolia.drpc.org");
  }

  return http();
};

const defaultTransports = {
  [sepolia.id]: resolveTransport(sepolia.id),
  [mainnet.id]: resolveTransport(mainnet.id),
};

function getConnectors() {
  if (typeof window === "undefined") {
    return [];
  }

  return [
    metaMask({
      dappMetadata: {
        name: "Web Wallet",
      },
    }),
  ];
}

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: getConnectors(),
  transports: defaultTransports,
});

export const primaryChain = DEFAULT_CHAIN;
