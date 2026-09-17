import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth";

export default auth((request) => {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/"];
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));

  // Auth.js must handle its own sign-in, callback, CSRF, and error endpoints.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (isPublic) return NextResponse.next();

  const session = request.auth;
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if ((pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
