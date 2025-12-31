import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/new"];

function isProtectedPath(pathname: string) {
  return (
    PROTECTED_PATHS.includes(pathname) ||
    pathname.startsWith("/api/posts") ||
    pathname.startsWith("/api/rate") ||
    pathname.startsWith("/logout")
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });
  if (!isProtectedPath(req.nextUrl.pathname)) {
    return res;
  }

  const supabase = createSupabaseMiddlewareClient(req, res);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return res;
  }

  if (req.nextUrl.pathname.startsWith("/api")) {
    const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.cookies.getAll().forEach((cookie) => {
      unauthorized.cookies.set(cookie);
    });
    return unauthorized;
  }

  const redirectUrl = new URL("/login", req.url);
  redirectUrl.searchParams.set("redirect", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  res.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export const config = {
  matcher: ["/new", "/api/:path*", "/logout"],
};
