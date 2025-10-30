/**
 * Auth Types for EuroCoin Wallet
 * Unified authentication system supporting both MetaMask wallet and OAuth email login
 */

import type { DefaultSession } from 'next-auth';

// ============================================================================
// Auth Type Enum
// ============================================================================

/**
 * Type of authentication method used
 * - 'wallet': MetaMask wallet connection (full access)
 * - 'email': OAuth email authentication (read-only access)
 */
export type AuthType = 'wallet' | 'email';

// ============================================================================
// User Types
// ============================================================================

/**
 * Base user information
 */
export interface BaseUser {
  id: string;
  authType: AuthType;
  createdAt?: Date;
}

/**
 * Wallet user (MetaMask)
 * Has full access including transactions
 */
export interface WalletUser extends BaseUser {
  authType: 'wallet';
  walletAddress: `0x${string}`;
  chainId?: number;
}

/**
 * Email user (OAuth)
 * Has read-only access
 */
export interface EmailUser extends BaseUser {
  authType: 'email';
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

/**
 * Union type for all user types
 */
export type User = WalletUser | EmailUser;

// ============================================================================
// Session Types
// ============================================================================

/**
 * Extended session for NextAuth
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      authType: AuthType;
      email?: string;
      name?: string;
      image?: string;
      walletAddress?: `0x${string}`;
    } & DefaultSession['user'];
  }

  interface User {
    authType: AuthType;
    walletAddress?: `0x${string}`;
  }
}

/**
 * JWT token extension
 */
declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    authType: AuthType;
    walletAddress?: `0x${string}`;
  }
}

// ============================================================================
// Auth State Types
// ============================================================================

/**
 * Authentication state for the unified auth hook
 */
export interface AuthState {
  /** Whether user is authenticated (any method) */
  isAuthenticated: boolean;

  /** Type of authentication used */
  authType: AuthType | null;

  /** User ID (from DB or wallet address) */
  userId?: string;

  /** Wallet address (if wallet auth) */
  walletAddress?: `0x${string}`;

  /** Email (if email auth) */
  email?: string;

  /** User name (if email auth) */
  name?: string;

  /** User avatar (if email auth) */
  image?: string;

  /** Whether user can make transactions (only wallet users) */
  canMakeTransactions: boolean;

  /** Loading state */
  isLoading: boolean;

  /** Chain ID (if wallet auth) */
  chainId?: number;

  /** Whether connected to supported network (if wallet auth) */
  isSupportedNetwork?: boolean;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission levels for different features
 */
export enum Permission {
  /** View public information */
  VIEW_PUBLIC = 'view_public',

  /** View wallet balance */
  VIEW_BALANCE = 'view_balance',

  /** View transaction history */
  VIEW_HISTORY = 'view_history',

  /** Make token transfers */
  TRANSFER_TOKENS = 'transfer_tokens',

  /** Create internal requests */
  CREATE_REQUESTS = 'create_requests',

  /** View internal requests */
  VIEW_REQUESTS = 'view_requests',
}

/**
 * Permission mapping by auth type
 */
export const AUTH_PERMISSIONS: Record<AuthType, Permission[]> = {
  wallet: [
    Permission.VIEW_PUBLIC,
    Permission.VIEW_BALANCE,
    Permission.VIEW_HISTORY,
    Permission.TRANSFER_TOKENS,
    Permission.CREATE_REQUESTS,
    Permission.VIEW_REQUESTS,
  ],
  email: [
    Permission.VIEW_PUBLIC,
    Permission.VIEW_BALANCE,
    Permission.VIEW_HISTORY,
    Permission.VIEW_REQUESTS,
    // Note: Email users CANNOT transfer tokens or create requests
  ],
};

/**
 * Check if user has specific permission
 */
export function hasPermission(authType: AuthType | null, permission: Permission): boolean {
  if (!authType) return false;
  return AUTH_PERMISSIONS[authType].includes(permission);
}

// ============================================================================
// OAuth Provider Types
// ============================================================================

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft';

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  id: OAuthProvider;
  name: string;
  icon: string;
  enabled: boolean;
}

// ============================================================================
// Auth Action Types
// ============================================================================

/**
 * Sign in methods
 */
export interface SignInMethods {
  /** Sign in with MetaMask wallet */
  signInWithWallet: () => Promise<void>;

  /** Sign in with OAuth provider */
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;

  /** Sign out (any method) */
  signOut: () => Promise<void>;
}

// ============================================================================
// Auth Context Types
// ============================================================================

/**
 * Auth context value
 */
export interface AuthContextValue extends AuthState, SignInMethods {
  /** Refresh auth state */
  refresh: () => Promise<void>;
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * User record in database
 */
export interface DbUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  authType: string;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Account record in database (OAuth connections)
 */
export interface DbAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  tokenType: string | null;
  scope: string | null;
  idToken: string | null;
  sessionState: string | null;
  createdAt: Date;
}

/**
 * Session record in database
 */
export interface DbSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for components that require authentication
 */
export interface RequireAuthProps {
  /** Required auth type (optional, defaults to any) */
  requiredAuthType?: AuthType;

  /** Required permissions (optional) */
  requiredPermissions?: Permission[];

  /** Fallback component if not authenticated */
  fallback?: React.ReactNode;
}

/**
 * Props for auth-aware components
 */
export interface AuthAwareProps {
  /** Current auth state */
  authState: AuthState;
}
