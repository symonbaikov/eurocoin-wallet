/**
 * NextAuth.js API Route Handler
 * Handles all OAuth authentication requests
 *
 * Endpoints:
 * - GET  /api/auth/signin         - Sign in page
 * - POST /api/auth/signin/:provider - Initiate OAuth flow
 * - GET  /api/auth/callback/:provider - OAuth callback
 * - POST /api/auth/signout        - Sign out
 * - GET  /api/auth/session        - Get current session
 * - GET  /api/auth/csrf           - Get CSRF token
 * - GET  /api/auth/providers      - Get available providers
 */

import { handlers } from '@/lib/auth';

// Export GET and POST handlers from NextAuth config
export const { GET, POST } = handlers;

// Note: NextAuth v5 automatically handles all authentication routes
// No need to manually define each endpoint
