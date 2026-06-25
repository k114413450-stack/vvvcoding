import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GAME_SITE_URL, isGameHost } from "@/lib/site-host";

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const { pathname } = request.nextUrl;

  if (isGameHost(host)) {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml"
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/guide/") || pathname === "/how-to-play") {
      return NextResponse.rewrite(new URL(`/game${pathname}`, request.url));
    }

    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.rewrite(new URL("/game", request.url));
  }

  if (pathname === "/play/crash" || pathname.startsWith("/play/")) {
    return NextResponse.redirect(GAME_SITE_URL);
  }

  if (pathname === "/game" || pathname.startsWith("/game/")) {
    return NextResponse.redirect(GAME_SITE_URL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
