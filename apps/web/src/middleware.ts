import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/about", "/privacy", "/terms", "/disclaimer"];
const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get("session_id")?.value;

  // Public pages: always accessible
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Auth pages: redirect to dashboard if already logged in
  if (AUTH_PATHS.includes(pathname)) {
    if (sessionId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: redirect to login if no session
  if (!sessionId) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - API routes (handled by backend)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
