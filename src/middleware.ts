import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, search } = request.nextUrl;

  // Public routes (no auth required)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If user is logged in and tries to access /auth → redirect to home
  if (pathname.startsWith("/auth") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not logged in and trying to access protected route
  if (!token && !pathname.startsWith("/auth")) {
    const loginUrl = new URL("/auth", request.url);

    // Preserve original destination for redirect-after-login
    loginUrl.searchParams.set("from", pathname + search);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
