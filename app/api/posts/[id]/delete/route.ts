import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ deleted: true })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    return applyCookies(NextResponse.json({ error: error.message }, { status: 400 }));
  }

  if (!data) {
    return applyCookies(NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  return applyCookies(NextResponse.json({ success: true }));
}
