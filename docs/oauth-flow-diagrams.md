# OAuth 2.0 Authentication Flow - Диаграммы

## Полные схемы работы системы аутентификации

---

## 1. Общая архитектура системы

```
┌──────────────────────────────────────────────────────────────────┐
│                        EuroCoin Wallet                           │
│                      Unified Auth System                         │
└──────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   MetaMask Authentication │   │    OAuth Authentication   │
│      (Wallet Type)        │   │      (Email Type)         │
└───────────────────────────┘   └───────────────────────────┘
        │                                   │
        │ Browser Extension                 │ OAuth 2.0 Flow
        │ Web3 Provider                     │ (Google/GitHub)
        │                                   │
        ▼                                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  • Full Access            │   │  • Read-Only Access       │
│  • View Balance           │   │  • View Balance           │
│  • Send Tokens            │   │  • View History           │
│  • Create Requests        │   │  • ❌ No Transactions    │
│  • Smart Contract Calls   │   │  • ❌ No Wallet Access   │
└───────────────────────────┘   └───────────────────────────┘
        │                                   │
        └──────────────┬────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Unified Session    │
            │   JWT Token          │
            │   httpOnly Cookie    │
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   PostgreSQL DB      │
            │   • users            │
            │   • accounts         │
            │   • sessions         │
            └──────────────────────┘
```

---

## 2. MetaMask Authentication Flow

```
┌────────┐                                                    ┌────────┐
│ User   │                                                    │MetaMask│
└───┬────┘                                                    └───┬────┘
    │                                                             │
    │  1. Открыть /login page                                    │
    ├──────────────────────────────────────────────────────────► │
    │                                                             │
    │  2. Клик на "Connect MetaMask"                             │
    ├──────────────────────────────────────────────────────────► │
    │                                                             │
    │  3. useWalletConnection.connect()                          │
    │     wagmi useConnect hook                                  │
    ├──────────────────────────────────────────────────────────► │
    │                                                             │
    │                                   4. MetaMask popup открыт  │
    │ ◄──────────────────────────────────────────────────────────┤
    │                                                             │
    │  5. User approves connection                               │
    ├──────────────────────────────────────────────────────────► │
    │                                                             │
    │                            6. eth_requestAccounts response │
    │                               address: 0x123...abc          │
    │ ◄──────────────────────────────────────────────────────────┤
    │                                                             │
    │  7. Set cookie: metamask_connected=true                    │
    │     expires: 7 days                                        │
    ├─────────────────────────►                                  │
    │                                                             │
    │  8. useAccount hook updates                                │
    │     - isConnected: true                                    │
    │     - address: 0x123...abc                                 │
    │     - chainId: 11155111 (Sepolia)                          │
    │                                                             │
    │  9. Toast: "Wallet connected successfully"                 │
    │                                                             │
    │  10. Redirect to / (home page)                             │
    ├────────────────────────────────────────────────────────►   │
    │                                                             │
    │  11. User lands on dashboard                               │
    │      authType: 'wallet'                                    │
    │      canMakeTransactions: true                             │
    │                                                             │
```

### Детали MetaMask Flow:

**Wagmi Configuration:**
```typescript
// lib/wagmi.tsx
const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
```

**Hook Usage:**
```typescript
// hooks/use-wallet-connection.ts
const { connectAsync, connectors } = useConnect();
const metaMaskConnector = connectors.find(c => c.id === 'io.metamask');

await connectAsync({
  connector: metaMaskConnector,
  chainId: DEFAULT_CHAIN.id,
});
```

---

## 3. Google OAuth Flow

```
┌──────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ User │         │  Next.js │         │ NextAuth │         │  Google  │
└──┬───┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
   │                  │                    │                    │
   │ 1. Visit /login │                    │                    │
   ├─────────────────►│                    │                    │
   │                  │                    │                    │
   │ 2. Render page  │                    │                    │
   │  - MetaMask btn │                    │                    │
   │  - Google btn   │                    │                    │
   │◄─────────────────┤                    │                    │
   │                  │                    │                    │
   │ 3. Click         │                    │                    │
   │ "Sign in with    │                    │                    │
   │  Google"         │                    │                    │
   ├─────────────────►│                    │                    │
   │                  │                    │                    │
   │                  │ 4. signIn('google')│                    │
   │                  ├───────────────────►│                    │
   │                  │                    │                    │
   │                  │                    │ 5. GET /api/auth/ │
   │                  │                    │    signin/google   │
   │                  │                    ├───────────────────►│
   │                  │                    │                    │
   │                  │                    │ 6. OAuth params:   │
   │                  │                    │    - client_id     │
   │                  │                    │    - redirect_uri  │
   │                  │                    │    - scope         │
   │                  │                    │    - state (CSRF)  │
   │                  │                    │                    │
   │ 7. Redirect to   │                    │                    │
   │ Google OAuth     │◄───────────────────┴────────────────────┤
   │ consent screen   │                                         │
   ├──────────────────────────────────────────────────────────► │
   │                                                             │
   │ 8. Google Login  │                                         │
   │    Screen:       │                                         │
   │    - Email       │                                         │
   │    - Password    │                                         │
   ├────────────────────────────────────────────────────────────►│
   │                                                             │
   │ 9. User enters   │                                         │
   │    credentials   │                                         │
   ├────────────────────────────────────────────────────────────►│
   │                                                             │
   │ 10. Google       │                                         │
   │     Consent      │                                         │
   │     Screen:      │                                         │
   │     "EuroCoin    │                                         │
   │      wants to:"  │                                         │
   │     ✓ email      │                                         │
   │     ✓ profile    │                                         │
   ├────────────────────────────────────────────────────────────►│
   │                                                             │
   │ 11. User clicks  │                                         │
   │     "Allow"      │                                         │
   ├────────────────────────────────────────────────────────────►│
   │                                                             │
   │                                        12. Redirect with    │
   │                                            authorization    │
   │                                            code             │
   │◄────────────────────────────────────────────────────────────┤
   │                                                             │
   │ 13. GET /api/auth/callback/google?code=xxx&state=xxx       │
   ├─────────────────►│                                         │
   │                  │ 14. Verify state    │                   │
   │                  ├────────────────────►│                   │
   │                  │     (CSRF check)    │                   │
   │                  │                     │                   │
   │                  │                     │ 15. Exchange code │
   │                  │                     │     for tokens    │
   │                  │                     ├──────────────────►│
   │                  │                     │                   │
   │                  │                     │ 16. Response:     │
   │                  │                     │    - access_token │
   │                  │                     │    - id_token     │
   │                  │                     │    - refresh_token│
   │                  │                     │◄──────────────────┤
   │                  │                     │                   │
   │                  │ 17. Decode JWT      │                   │
   │                  │     Extract profile:│                   │
   │                  │     - email         │                   │
   │                  │     - name          │                   │
   │                  │     - picture       │                   │
   │                  │                     │                   │
┌──┴───────────────────────────────────────────────────────────┐
│         18. NextAuth Callbacks (lib/auth.ts)                 │
│                                                              │
│  async signIn({ user, account, profile }) {                 │
│    // Create or update user in DB                           │
│    const dbUser = await createOrUpdateUser({                │
│      email: profile.email,                                  │
│      name: profile.name,                                    │
│      image: profile.picture,                                │
│      authType: 'email',                                     │
│    });                                                       │
│                                                              │
│    // Create account record                                 │
│    await createAccount({                                    │
│      userId: dbUser.id,                                     │
│      provider: 'google',                                    │
│      providerAccountId: account.providerAccountId,          │
│      accessToken: account.access_token,                     │
│      refreshToken: account.refresh_token,                   │
│    });                                                       │
│                                                              │
│    return true; // Allow sign in                            │
│  }                                                           │
│                                                              │
│  async jwt({ token, user, account }) {                      │
│    if (user) {                                              │
│      token.userId = user.id;                                │
│      token.authType = 'email';                              │
│    }                                                         │
│    return token;                                            │
│  }                                                           │
│                                                              │
│  async session({ session, token }) {                        │
│    session.user.id = token.userId;                          │
│    session.user.authType = token.authType;                  │
│    return session;                                          │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
   │                  │                     │                   │
   │ 19. Set session  │                     │                   │
   │     cookie:      │                     │                   │
   │     __Secure-    │                     │                   │
   │     next-auth.   │                     │                   │
   │     session-     │                     │                   │
   │     token        │                     │                   │
   │     (JWT)        │                     │                   │
   │                  │                     │                   │
   │ 20. Redirect to  │                     │                   │
   │     / (home)     │                     │                   │
   │◄─────────────────┤                     │                   │
   │                  │                     │                   │
   │ 21. User lands   │                     │                   │
   │     on dashboard │                     │                   │
   │     - authType:  │                     │                   │
   │       'email'    │                     │                   │
   │     - canMake    │                     │                   │
   │       Trans-     │                     │                   │
   │       actions:   │                     │                   │
   │       false      │                     │                   │
   │                  │                     │                   │
```

---

## 4. GitHub OAuth Flow

GitHub OAuth flow аналогичен Google OAuth, с небольшими отличиями:

```
Key Differences:

1. Authorization URL:
   Google: https://accounts.google.com/o/oauth2/v2/auth
   GitHub: https://github.com/login/oauth/authorize

2. Token Exchange:
   Google: https://oauth2.googleapis.com/token
   GitHub: https://github.com/login/oauth/access_token

3. User Info:
   Google: https://www.googleapis.com/oauth2/v2/userinfo
   GitHub: https://api.github.com/user

4. Scopes:
   Google: 'openid email profile'
   GitHub: 'read:user user:email'

5. Provider ID in DB:
   Google: 'google'
   GitHub: 'github'
```

### GitHub OAuth Configuration:

```typescript
// lib/auth.ts
import GitHub from 'next-auth/providers/github';

providers: [
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'read:user user:email',
      },
    },
  }),
]
```

---

## 5. Unified Auth Hook Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    useAuth() Hook                            │
│           Unified Authentication State                       │
└──────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────────┐          ┌─────────────────────┐
│ useSession()        │          │ useAccount()        │
│ (NextAuth)          │          │ (wagmi)             │
│                     │          │                     │
│ Returns:            │          │ Returns:            │
│ - session           │          │ - address           │
│ - status            │          │ - isConnected       │
│ - user data         │          │ - chainId           │
└─────────────────────┘          └─────────────────────┘
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │  Compute Auth State    │
               │                        │
               │  if (isConnected) {    │
               │    authType = 'wallet' │
               │    can = true          │
               │  }                     │
               │  else if (session) {   │
               │    authType = 'email'  │
               │    can = false         │
               │  }                     │
               │  else {                │
               │    authType = null     │
               │    can = false         │
               │  }                     │
               └────────────────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │   Return AuthState     │
               │                        │
               │ {                      │
               │   isAuthenticated,     │
               │   authType,            │
               │   userId,              │
               │   walletAddress,       │
               │   email,               │
               │   canMakeTransactions, │
               │   isLoading,           │
               │ }                      │
               └────────────────────────┘
```

### useAuth Implementation:

```typescript
// hooks/use-auth.ts
export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  return useMemo(() => {
    // Loading state
    if (status === 'loading') {
      return {
        isAuthenticated: false,
        authType: null,
        canMakeTransactions: false,
        isLoading: true,
      };
    }

    // MetaMask authentication
    if (isConnected && address) {
      return {
        isAuthenticated: true,
        authType: 'wallet',
        walletAddress: address,
        canMakeTransactions: true,
        isLoading: false,
      };
    }

    // OAuth email authentication
    if (session?.user) {
      return {
        isAuthenticated: true,
        authType: 'email',
        userId: session.user.id,
        email: session.user.email,
        canMakeTransactions: false,
        isLoading: false,
      };
    }

    // Not authenticated
    return {
      isAuthenticated: false,
      authType: null,
      canMakeTransactions: false,
      isLoading: false,
    };
  }, [session, status, address, isConnected]);
}
```

---

## 6. Middleware Protection Flow

```
┌──────┐                    ┌──────────┐                ┌──────────┐
│ User │                    │Middleware│                │ Next.js  │
└──┬───┘                    └────┬─────┘                └────┬─────┘
   │                             │                           │
   │ 1. Request /               │                           │
   ├────────────────────────────►│                           │
   │                             │                           │
   │                             │ 2. Check authentication   │
   │                             │    await auth()           │
   │                             │                           │
   │                             │ 3. Is authenticated?      │
   │                             ├───────────┐               │
   │                             │           │               │
   │                             │◄──────────┘               │
   │                             │                           │
   ├─────────── YES ─────────────┤                           │
   │                             │                           │
   │                             │ 4. Allow request          │
   │                             ├──────────────────────────►│
   │                             │                           │
   │ 5. Render page              │                           │
   │◄────────────────────────────┴───────────────────────────┤
   │                                                         │
   │                                                         │
   ├─────────── NO ──────────────┐                           │
   │                             │                           │
   │                             │ 6. Redirect to /login     │
   │◄────────────────────────────┤                           │
   │                             │                           │
   │ 7. User sees login page     │                           │
   │                             │                           │
```

### Middleware Implementation:

```typescript
// middleware.ts
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Not authenticated + not on login page → redirect to login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated + on login page → redirect to home
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
};
```

---

## 7. Permission Check Flow

```
┌─────────────────────────────────────────────────────────┐
│              Component Renders                          │
│         (e.g., TransferForm)                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ const { authType,     │
            │   canMakeTransactions │
            │ } = useAuth()         │
            └───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Check permissions     │
            └───────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌────────────────┐           ┌────────────────────┐
│ authType =     │           │ authType = 'email' │
│ 'wallet'       │           │                    │
│                │           │                    │
│ canMakeTrans-  │           │ canMakeTrans-      │
│ actions = true │           │ actions = false    │
└────────────────┘           └────────────────────┘
        │                               │
        ▼                               ▼
┌────────────────┐           ┌────────────────────┐
│ Render full    │           │ Render ReadOnly    │
│ transfer form  │           │ banner:            │
│                │           │                    │
│ [Amount]       │           │ "Email users       │
│ [Recipient]    │           │  cannot make       │
│ [Send]         │           │  transactions.     │
│                │           │  Connect MetaMask  │
│                │           │  for full access"  │
└────────────────┘           └────────────────────┘
```

### Permission Component Example:

```typescript
// components/wallet/transfer-form.tsx
import { useAuth } from '@/hooks/use-auth';

export function TransferForm() {
  const { canMakeTransactions, authType } = useAuth();

  if (!canMakeTransactions) {
    return (
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Read-only mode</AlertTitle>
        <AlertDescription>
          Email users cannot make transactions.
          Connect MetaMask for full access.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleTransfer}>
      {/* Full transfer form */}
    </form>
  );
}
```

---

## 8. Session Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                   Session Lifecycle                      │
└──────────────────────────────────────────────────────────┘

1. Sign In
   ├─ User authenticates (MetaMask or OAuth)
   ├─ JWT token created (encrypted)
   ├─ Cookie set: __Secure-next-auth.session-token
   │  - httpOnly: true
   │  - secure: true (production)
   │  - sameSite: 'lax'
   │  - maxAge: 7 days
   └─ Session record created in DB (optional)

2. Active Session
   ├─ Every request includes session cookie
   ├─ Middleware verifies JWT signature
   ├─ Token decoded to get user info
   └─ User authorized for protected routes

3. Token Refresh
   ├─ Token age > updateAge (24 hours)
   ├─ NextAuth automatically refreshes JWT
   ├─ New token issued with extended expiry
   └─ Cookie updated

4. Sign Out
   ├─ User clicks "Sign Out" button
   ├─ signOut() called (NextAuth or wagmi)
   ├─ Session cookie cleared
   ├─ Session record deleted from DB
   ├─ MetaMask disconnected (if wallet user)
   └─ Redirect to /login

5. Session Expiry
   ├─ Token maxAge exceeded (7 days)
   ├─ Middleware detects expired token
   ├─ User redirected to /login
   └─ Toast: "Session expired. Please sign in again."
```

### Session Configuration:

```typescript
// lib/auth.ts
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60,     // 7 days
  updateAge: 24 * 60 * 60,       // Update daily
}
```

---

## 9. Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│                  Error Scenarios                         │
└──────────────────────────────────────────────────────────┘

1. OAuth Provider Error
   ├─ Google/GitHub service down
   ├─ Invalid credentials
   ├─ User denies consent
   │
   └─► NextAuth catches error
       └─► Redirect to /login?error=OAuthSignin
           └─► Show toast: "Sign in failed. Try again."

2. MetaMask Not Installed
   ├─ User clicks "Connect MetaMask"
   ├─ window.ethereum not detected
   │
   └─► useWalletConnection throws error
       └─► Show modal: "Please install MetaMask"
           └─► Display QR code for mobile

3. User Rejects MetaMask Connection
   ├─ MetaMask popup appears
   ├─ User clicks "Reject"
   │
   └─► wagmi connector throws error
       └─► Toast: "Connection rejected"
           └─► User stays on /login

4. Network Mismatch
   ├─ User connected to Polygon (not Sepolia)
   ├─ useAccount chainId !== SUPPORTED_CHAINS
   │
   └─► Show UnsupportedNetworkAlert
       └─► Prompt: "Switch to Sepolia"
           └─► Button: "Switch Network"

5. Session Expired
   ├─ JWT token maxAge exceeded
   ├─ Middleware detects expired session
   │
   └─► Redirect to /login
       └─► Toast: "Session expired"

6. Database Error
   ├─ PostgreSQL connection failed
   ├─ Query timeout
   │
   └─► Log error to console/Sentry
       └─► Show generic error page
           └─► "Something went wrong. Try again."

7. CSRF Attack Detected
   ├─ OAuth state parameter mismatch
   ├─ NextAuth detects invalid state
   │
   └─► Reject authentication
       └─► Redirect to /login?error=OAuthCallback
           └─► Toast: "Security error. Try again."
```

---

## 10. Multi-Device Session Management

```
User has 3 devices:
- Desktop Browser (Chrome)
- Laptop (Firefox)
- Mobile (Safari)

┌────────────────────────────────────────────────────────┐
│                Desktop (Chrome)                        │
│  • Sign in with Google                                 │
│  • Session token: abc123...                            │
│  • Expires: 2025-11-05                                 │
└────────────────────────────────────────────────────────┘
                         │
                         │ Same user
                         │
┌────────────────────────────────────────────────────────┐
│                Laptop (Firefox)                        │
│  • Sign in with Google (same account)                  │
│  • Session token: def456... (different)                │
│  • Expires: 2025-11-05                                 │
└────────────────────────────────────────────────────────┘
                         │
                         │ Same user
                         │
┌────────────────────────────────────────────────────────┐
│                Mobile (Safari)                         │
│  • Sign in with MetaMask                               │
│  • Wallet address: 0x123...abc                         │
│  • Cookie: metamask_connected=true                     │
└────────────────────────────────────────────────────────┘

Database State:
┌──────────────────────────────────────────────────────┐
│ users table                                          │
├──────────────────────────────────────────────────────┤
│ id: user-uuid-123                                    │
│ email: user@example.com                              │
│ authType: 'email' (primary)                          │
│ walletAddress: 0x123...abc (optional link)           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ sessions table                                       │
├──────────────────────────────────────────────────────┤
│ session_token: abc123... (Desktop)                   │
│ user_id: user-uuid-123                               │
│ expires: 2025-11-05                                  │
├──────────────────────────────────────────────────────┤
│ session_token: def456... (Laptop)                    │
│ user_id: user-uuid-123                               │
│ expires: 2025-11-05                                  │
└──────────────────────────────────────────────────────┘

Key Points:
✅ Multiple sessions allowed per user
✅ Each device has independent session token
✅ Sign out on one device doesn't affect others
✅ Can link wallet address to OAuth account
```

---

## 11. Future: Account Linking Flow

```
Scenario: User signed in with Google,
          now wants to link MetaMask

┌────────┐                              ┌──────────┐
│ User   │                              │  System  │
└───┬────┘                              └────┬─────┘
    │                                        │
    │ 1. Currently signed in with Google    │
    │    authType: 'email'                  │
    │                                        │
    │ 2. Click "Link MetaMask Wallet"       │
    ├───────────────────────────────────────►│
    │                                        │
    │ 3. MetaMask popup opens                │
    │    Request connection                  │
    ├───────────────────────────────────────►│
    │                                        │
    │ 4. User approves                       │
    ├───────────────────────────────────────►│
    │                                        │
    │                            5. Update DB│
    │                               users:   │
    │                               wallet-  │
    │                               Address  │
    │                               = 0x...  │
    │                                        │
    │                            6. Update   │
    │                               session: │
    │                               authType │
    │                               = 'wallet'│
    │                                        │
    │ 7. Toast: "Wallet linked successfully"│
    │    "You now have full access"          │
    │◄───────────────────────────────────────┤
    │                                        │
    │ 8. Refresh page                        │
    │    canMakeTransactions: true           │
    │                                        │
```

---

## Резюме диаграмм

✅ **8 основных flow** документированы
✅ **Детальные последовательности** для каждого сценария
✅ **Error handling** покрыт
✅ **Multi-device sessions** объяснены
✅ **Future features** (account linking) запланированы

Все диаграммы готовы для reference при имплементации! 🚀
