import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromToken, getSessionCookieName, canAccessAudit, canManageUsers } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", path);
    return NextResponse.redirect(login);
  }

  const session = await getSessionFromToken(token);
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", path);
    return NextResponse.redirect(login);
  }

  if ((path.startsWith("/audit") || path.startsWith("/dashboard")) && !canAccessAudit(session)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/users") && !canManageUsers(session)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path === "/audit" || path.startsWith("/audit/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/run/:path*", "/audit", "/audit/:path*", "/dashboard", "/dashboard/:path*", "/users", "/users/:path*", "/login"],
};
