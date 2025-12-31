import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req);
  await supabase.auth.signOut();
  return applyCookies(
    NextResponse.redirect(new URL("/", req.url), { status: 302 }),
  );
}
