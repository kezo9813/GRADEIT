import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const body = await req.json().catch(() => null);
  const postId = body?.postId as string | undefined;
  const value = Number(body?.value);

  if (!postId) {
    return applyCookies(NextResponse.json({ error: "Missing post id" }, { status: 400 }));
  }

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return applyCookies(
      NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 }),
    );
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, deleted")
    .eq("id", postId)
    .single();

  if (postError || !post || post.deleted) {
    return applyCookies(NextResponse.json({ error: "Post not found" }, { status: 404 }));
  }

  const { error: upsertError } = await supabase
    .from("ratings")
    .upsert({ post_id: postId, user_id: user.id, value }, { onConflict: "post_id,user_id" });

  if (upsertError) {
    return applyCookies(NextResponse.json({ error: upsertError.message }, { status: 400 }));
  }

  const { data: allRatings, error: statsError } = await supabase
    .from("ratings")
    .select("value")
    .eq("post_id", postId);

  if (statsError) {
    return applyCookies(NextResponse.json({ error: statsError.message }, { status: 400 }));
  }

  const count = allRatings?.length ?? 0;
  const avg =
    count === 0
      ? 0
      : Number(
          (
            (allRatings ?? []).reduce((sum, r) => sum + (r?.value ?? 0), 0) /
            Math.max(count, 1)
          ).toFixed(2),
        );

  return applyCookies(NextResponse.json({ value, avg, count }));
}
