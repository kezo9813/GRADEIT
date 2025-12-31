import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { getSupabaseEnv } from "../env";

type CookiePayload = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    expires?: string | number | Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
  };
};

function normalizeCookieOptions(
  options?: CookiePayload["options"],
): Partial<ResponseCookie> | undefined {
  if (!options) return undefined;
  const { expires, ...rest } = options;
  const parsedExpires =
    typeof expires === "string" ? new Date(expires) : expires;
  return { ...rest, expires: parsedExpires };
}

export function createSupabaseRouteClient(req: NextRequest) {
  const cookiesToSet: CookiePayload[] = [];
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(
          ...cookies.map((cookie) => ({
            ...cookie,
            options: {
              ...cookie.options,
              // Next can pass boolean sameSite, normalize to string/undefined for type safety
              sameSite:
                cookie.options?.sameSite === true
                  ? "lax"
                  : cookie.options?.sameSite === false
                    ? undefined
                    : cookie.options?.sameSite,
            },
          })),
        );
      },
    },
  });

  const applyCookies = <T extends NextResponse>(res: T): T => {
    cookiesToSet.forEach(({ name, value, options }) => {
      const normalized = normalizeCookieOptions(options);
      res.cookies.set(name, value, normalized);
    });
    return res;
  };

  return { supabase, applyCookies };
}
