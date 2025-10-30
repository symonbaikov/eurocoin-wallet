import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check MetaMask cookie
  const isMetaMaskConnected = request.cookies.get("metamask_connected")?.value === "true";

  // Check NextAuth session cookie (OAuth authentication)
  // Cookie name is "next-auth.session-token" in development, "__Secure-next-auth.session-token" in production
  const hasNextAuthSession = request.cookies.has("next-auth.session-token") ||
                             request.cookies.has("__Secure-next-auth.session-token");

  // User is authenticated if they have either MetaMask connection OR OAuth session
  const isAuthenticated = isMetaMaskConnected || hasNextAuthSession;

  console.log('[Middleware]', {
    pathname,
    isMetaMaskConnected,
    hasNextAuthSession,
    isAuthenticated,
    cookies: request.cookies.getAll().map(c => c.name)
  });

  // Define public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/info", // Info pages (terms, requests, exchange)
    "/_next",
    "/api",
    "/static",
    "/favicon.ico",
    "/metamask.png",
    "/logo.png",
    "/coinPNG.png",
    "/file.svg",
    "/globe.svg",
    "/next.svg",
    "/vercel.svg",
    "/window.svg",
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If authenticated and trying to access login, redirect to home
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not authenticated and trying to access a protected path, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the matcher to run middleware on all paths except specific ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api (API routes)
     * - /static (custom static files)
     * - Static assets (images, icons, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|static|metamask.png|logo.png|coinPNG.png|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
