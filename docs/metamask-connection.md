# MetaMask Connection Flow

This document describes how the dashboard connects a user wallet with MetaMask using **wagmi v2** and our configuration.

## Prerequisites

- Browser with the MetaMask extension installed and unlocked.
- Environment variables set in `.env.local` (or `.env` in this repo) with:
  - `NEXT_PUBLIC_RPC_URL`
  - `NEXT_PUBLIC_TOKEN_ADDRESS`
  - `NEXT_PUBLIC_TOKEN_CHAIN_ID`
- The app running via `npm run dev` or deployed build.

## How the Flow Works

1. **Configuration (`lib/wagmi.tsx`, `config/token.ts`, `config/chains.ts`)**
   - `TOKEN_CONFIG` parses the ERC-20 address and target `chainId`.
   - `DEFAULT_CHAIN` is derived from that `chainId`.
   - Wagmi’s MetaMask connector is registered globally with `shimDisconnect` so the dapp remembers disconnects.
   - HTTP transports reuse `NEXT_PUBLIC_RPC_URL` for the primary chain and fall back to public RPCs for other networks.

2. **Provider Setup (`components/providers/app-providers.tsx`)**
   - The entire app is wrapped in `<WagmiProvider>` to expose the config.
   - React Query and Theme providers sit inside so hooks can execute safely on the client.

3. **Connecting (`hooks/use-wallet-connection.ts`, `components/wallet/connect-button.tsx`)**
   - `useWalletConnection` wraps wagmi hooks:
     - Finds the MetaMask connector and exposes `connect` / `disconnect`.
     - Requests MetaMask to connect on `DEFAULT_CHAIN.id`. If the user is on another network, MetaMask prompts to switch.
     - Keeps status flags (`isConnected`, `isConnecting`, etc.) for UI components.
   - `ConnectButton` calls `connect()` and shows toast notifications for success or errors. It’s disabled until MetaMask is detected.

4. **Network Guard (`hooks/use-supported-network.ts`, `components/wallet/unsupported-network-alert.tsx`)**
   - After connection, if MetaMask is on the wrong chain the `UnsupportedNetworkAlert` automatically attempts to switch to `DEFAULT_CHAIN`.
   - UI badges and alerts show the expected network name pulled from config.

5. **Token Data (`hooks/use-token-info.ts`, `hooks/use-token-balance.ts`, `hooks/use-token-tax.ts`)**
   - Once the wallet is connected and the network matches, hooks start fetching contract data through wagmi’s `useReadContract`.
   - Balance, tax, and USD value refresh on timers using the connected account.

## Testing the Flow Locally

1. Configure `.env.local` with your RPC, token, and chain ID.
2. Start the dev server: `npm run dev`.
3. Open the app in a MetaMask-enabled browser.
4. Click **“Подключить MetaMask”**:
   - MetaMask should prompt for connection and (if needed) a network switch.
   - On success, toast confirmation appears and wallet data populates.
5. Disconnect from MetaMask (via MetaMask UI or future disconnect button) to return to the initial state.

## Troubleshooting

- **Button disabled**: MetaMask extension is missing or locked; ensure `metaMaskConnector.ready` becomes true.
- **Wrong network**: Accept the switch prompt or manually select the configured chain in MetaMask.
- **RPC errors**: Verify `NEXT_PUBLIC_RPC_URL` is reachable and the token contract exists on the selected chain.
- **Balance or tax still blank**: Confirm the contract exposes `symbol`, `decimals`, `balanceOf`, and the configured tax function. Also check that the connected account holds the token.
