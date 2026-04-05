import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — redirects unauthenticated users to /login.
 *
 * Checks for the presence of the access_token HttpOnly cookie set by the
 * backend on successful login. If absent, the request is redirected to /login.
 *
 * Public routes that are always accessible without authentication:
 *   /login, /forgot-password, /reset-password
 *
 * Internal Next.js paths that are always skipped:
 *   /_next, /favicon.ico, /api
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /login
     * - /forgot-password
     * - /reset-password (and sub-paths e.g. /reset-password/[token])
     * - /_next (Next.js internals)
     * - /favicon.ico
     * - /api (API route handlers, if any)
     */
    "/((?!login|forgot-password|reset-password|_next|favicon\\.ico|api).*)",
  ],
};
