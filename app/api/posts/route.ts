import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import type { PostKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return applyCookies(
      NextResponse.json({ error: "Failed to resolve session" }, { status: 500 }),
    );
  }

  if (!user) {
    return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const form = await req.formData();
  const kind = String(form.get("kind") || "");
  const title = (form.get("title") as string | null)?.trim() || null;
  const textContent = (form.get("text_content") as string | null)?.trim() || null;
  const durationStr = (form.get("duration_ms") as string | null) || null;
  const file = form.get("file");

  const allowedKinds: PostKind[] = ["text", "image", "video"];
  if (!allowedKinds.includes(kind as PostKind)) {
    return applyCookies(NextResponse.json({ error: "Invalid post kind" }, { status: 400 }));
  }

  if (kind === "text" && !title && !textContent) {
    return applyCookies(
      NextResponse.json({ error: "Add a title or some text." }, { status: 400 }),
    );
  }

  let mediaPath: string | null = null;
  let mediaMime: string | null = null;
  let videoDurationMs: number | null = null;
  let uploadedPath: string | null = null;

  if (kind === "image" || kind === "video") {
    if (!(file instanceof File)) {
      return applyCookies(
        NextResponse.json({ error: "Media is required for this post type." }, { status: 400 }),
      );
    }

    if (kind === "image" && !file.type.startsWith("image/")) {
      return applyCookies(
        NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 }),
      );
    }

    if (kind === "video" && !file.type.startsWith("video/")) {
      return applyCookies(
        NextResponse.json({ error: "Only video uploads are allowed." }, { status: 400 }),
      );
    }

    if (kind === "image" && file.size > MAX_IMAGE_BYTES) {
      return applyCookies(
        NextResponse.json({ error: "Images must be 5MB or less." }, { status: 400 }),
      );
    }

    if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
      return applyCookies(
        NextResponse.json({ error: "Videos must be 20MB or less." }, { status: 400 }),
      );
    }

    if (kind === "video") {
      videoDurationMs = durationStr ? Number(durationStr) : null;
      if (!videoDurationMs || Number.isNaN(videoDurationMs) || videoDurationMs > 10000) {
        return applyCookies(
          NextResponse.json({ error: "Video duration must be 10 seconds or less." }, { status: 400 }),
        );
      }
    }

    const postId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `${user.id}/${postId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return applyCookies(
        NextResponse.json({ error: uploadError.message }, { status: 400 }),
      );
    }

    mediaPath = path;
    mediaMime = file.type;
    uploadedPath = path;

    const { error: insertError, data } = await supabase
      .from("posts")
      .insert({
        id: postId,
        user_id: user.id,
        kind,
        title,
        text_content: textContent,
        media_path: mediaPath,
        media_mime: mediaMime,
        video_duration_ms: videoDurationMs,
      })
      .select("id")
      .single();

    if (insertError) {
      if (uploadedPath) {
        await supabase.storage.from("media").remove([uploadedPath]);
      }
      return applyCookies(
        NextResponse.json({ error: insertError.message }, { status: 400 }),
      );
    }

    return applyCookies(NextResponse.json({ id: data.id }));
  }

  // text post (no media)
  const { error: insertError, data } = await supabase
    .from("posts")
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      kind,
      title,
      text_content: textContent,
    })
    .select("id")
    .single();

  if (insertError) {
    return applyCookies(NextResponse.json({ error: insertError.message }, { status: 400 }));
  }

  return applyCookies(NextResponse.json({ id: data.id }));
}
