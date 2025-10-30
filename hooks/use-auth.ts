'use client';

/**
 * Unified Auth Hook
 * Combines MetaMask (wallet) and OAuth (email) authentication
 * Returns unified authentication state
 */

import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import type { AuthState } from '@/types/auth';

/**
 * Get current authentication state
 * Works with both MetaMask wallet and OAuth providers
 *
 * @returns AuthState with unified authentication information
 *
 * @example
 * ```tsx
 * const { isAuthenticated, authType, canMakeTransactions } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <LoginPage />;
 * }
 *
 * if (canMakeTransactions) {
 *   return <TransferForm />;
 * } else {
 *   return <ReadOnlyBanner />;
 * }
 * ```
 */
export function useAuth(): AuthState {
  // NextAuth session (OAuth providers: Google, GitHub)
  const { data: session, status: sessionStatus } = useSession();

  // Wagmi account (MetaMask wallet)
  const { address, isConnected, chainId } = useAccount();

  return useMemo(() => {
    // Loading state - checking authentication
    if (sessionStatus === 'loading') {
      return {
        isAuthenticated: false,
        authType: null,
        canMakeTransactions: false,
        isLoading: true,
      };
    }

    // Priority 1: MetaMask wallet authentication
    // Wallet users have full access including transactions
    if (isConnected && address) {
      return {
        isAuthenticated: true,
        authType: 'wallet',
        walletAddress: address,
        chainId,
        canMakeTransactions: true,
        isLoading: false,
        isSupportedNetwork: chainId === 11155111 || chainId === 1, // Sepolia or Mainnet
      };
    }

    // Priority 2: OAuth email authentication
    // Email users have read-only access (no transactions)
    if (session?.user) {
      return {
        isAuthenticated: true,
        authType: 'email',
        userId: session.user.id,
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        canMakeTransactions: false, // Email users cannot make transactions
        isLoading: false,
      };
    }

    // Not authenticated - no MetaMask and no OAuth session
    return {
      isAuthenticated: false,
      authType: null,
      canMakeTransactions: false,
      isLoading: false,
    };
  }, [session, sessionStatus, address, isConnected, chainId]);
}

/**
 * Check if user can make transactions
 * Only wallet users can make transactions
 */
export function useCanMakeTransactions(): boolean {
  const { canMakeTransactions } = useAuth();
  return canMakeTransactions;
}

/**
 * Check if user is authenticated (any method)
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Get current auth type
 */
export function useAuthType(): 'wallet' | 'email' | null {
  const { authType } = useAuth();
  return authType;
}
