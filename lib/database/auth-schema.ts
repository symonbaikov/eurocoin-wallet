/**
 * Drizzle ORM Schema for NextAuth.js Authentication
 * Compatible with NextAuth.js v5 and @auth/drizzle-adapter
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  boolean,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

// =============================================================================
// Users Table
// =============================================================================

export const authUsers = pgTable(
  'auth_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: timestamp('email_verified', { withTimezone: true, mode: 'date' }),
    image: text('image'),

    // Custom fields for unified auth system
    authType: text('auth_type', { enum: ['email', 'wallet'] })
      .notNull()
      .default('email'),
    walletAddress: text('wallet_address').unique(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_auth_users_email').on(table.email),
    walletIdx: index('idx_auth_users_wallet').on(table.walletAddress),
    authTypeIdx: index('idx_auth_users_auth_type').on(table.authType),
    createdAtIdx: index('idx_auth_users_created_at').on(table.createdAt),
  })
);

// Type inference
export type AuthUser = typeof authUsers.$inferSelect;
export type NewAuthUser = typeof authUsers.$inferInsert;

// =============================================================================
// Accounts Table (OAuth Providers)
// =============================================================================

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),

    // OAuth tokens
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: bigint('expires_at', { mode: 'number' }),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_auth_accounts_user_id').on(table.userId),
    providerIdx: index('idx_auth_accounts_provider').on(table.provider),
    providerAccountIdx: index('idx_auth_accounts_provider_account').on(
      table.provider,
      table.providerAccountId
    ),
  })
);

// Type inference
export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;

// =============================================================================
// Sessions Table
// =============================================================================

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionToken: text('session_token').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_auth_sessions_user_id').on(table.userId),
    tokenIdx: index('idx_auth_sessions_token').on(table.sessionToken),
    expiresIdx: index('idx_auth_sessions_expires').on(table.expires),
  })
);

// Type inference
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

// =============================================================================
// Verification Tokens Table
// =============================================================================

export const authVerificationTokens = pgTable(
  'auth_verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull().unique(),
    expires: timestamp('expires', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
    expiresIdx: index('idx_auth_verification_expires').on(table.expires),
  })
);

// Type inference
export type AuthVerificationToken = typeof authVerificationTokens.$inferSelect;
export type NewAuthVerificationToken = typeof authVerificationTokens.$inferInsert;

// =============================================================================
// Authenticators Table (WebAuthn/Passkeys - Future)
// =============================================================================

export const authAuthenticators = pgTable(
  'auth_authenticators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    credentialId: text('credential_id').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: bigint('counter', { mode: 'number' }).notNull(),
    credentialDeviceType: text('credential_device_type').notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: text('transports'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_auth_authenticators_user_id').on(table.userId),
  })
);

// Type inference
export type AuthAuthenticator = typeof authAuthenticators.$inferSelect;
export type NewAuthAuthenticator = typeof authAuthenticators.$inferInsert;

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Complete user data with accounts
 */
export interface UserWithAccounts extends AuthUser {
  accounts: AuthAccount[];
}

/**
 * User data with sessions
 */
export interface UserWithSessions extends AuthUser {
  sessions: AuthSession[];
}

/**
 * Session with user data
 */
export interface SessionWithUser extends AuthSession {
  user: AuthUser;
}

// =============================================================================
// Export all tables for Drizzle Adapter
// =============================================================================

/**
 * Tables object for NextAuth Drizzle Adapter
 * Usage: DrizzleAdapter(db, { usersTable, accountsTable, ... })
 */
export const authTables = {
  users: authUsers,
  accounts: authAccounts,
  sessions: authSessions,
  verificationTokens: authVerificationTokens,
  authenticators: authAuthenticators,
};
