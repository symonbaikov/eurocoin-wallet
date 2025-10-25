import { ethers } from "ethers";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;

if (!rpcUrl || !tokenAddress) {
  throw new Error(
    "Missing NEXT_PUBLIC_RPC_URL or NEXT_PUBLIC_TOKEN_ADDRESS environment variables."
  );
}

const provider = new ethers.JsonRpcProvider(rpcUrl);

const token = new ethers.Contract(
  tokenAddress,
  ["function name() view returns (string)", "function symbol() view returns (string)"],
  provider
);

(async () => {
  const [name, symbol] = await Promise.all([token.name(), token.symbol()]);
  console.log(`Token name: ${name}`);
  console.log(`Token symbol: ${symbol}`);
})();
