import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Cookie-presence check only — never an authorization decision (see root
// CLAUDE.md convention #3). Whether the session is actually valid, and
// whether its user owns whatever the route is about to render, is decided
// downstream in src/lib/session.ts and src/db/queries/.
//
// Add new (app)/ routes to PROTECTED_PREFIXES as they're built, and keep
// the matcher below in sync.
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PREFIXES = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const hasSession = !!getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PREFIXES.some((p) => pathname.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
