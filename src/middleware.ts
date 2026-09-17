import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/"];
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));

  // Auth.js must handle its own sign-in, callback, CSRF, and error endpoints.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (isPublic) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (token) {
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
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
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
