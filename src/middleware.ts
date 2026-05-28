import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/tokusho",
  "/how-it-works",
  "/help",
  "/contact",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  });

  if (isPublic) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("auth");
  let auth: { role: string; email: string } | null = null;

  if (authCookie) {
    try {
      auth = JSON.parse(authCookie.value);
    } catch {
      // 不正なCookieは無視
    }
  }

  if (!auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && auth.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
