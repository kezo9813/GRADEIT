/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/DeleteButton";
import { RatingWidget } from "@/components/RatingWidget";
import { buildPublicMediaUrl } from "@/lib/media";
import { toPostWithStats } from "@/lib/posts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PostWithRatings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const [{ data: userData }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(
        "id,created_at,user_id,kind,title,text_content,media_path,media_mime,video_duration_ms,deleted, ratings:ratings(user_id,value)",
      )
      .eq("id", params.id)
      .limit(1),
  ]);

  if (error) throw error;
  const record = data?.[0] as PostWithRatings | undefined;
  if (!record || record.deleted) {
    notFound();
  }

  const userId = userData.user?.id ?? null;
  const post = toPostWithStats(record, userId);
  const mediaUrl = buildPublicMediaUrl(post.media_path);
  const created = new Date(post.created_at);
  const isOwner = userId === post.user_id;

  return (
    <main className="stack">
      <article className="panel card" style={{ padding: 20 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <span className="badge">{post.kind.toUpperCase()}</span>
            <span className="muted">{created.toLocaleString()}</span>
          </div>
        </div>
        <div className="stack" style={{ marginTop: 10 }}>
          {post.title ? <h1 className="section-title">{post.title}</h1> : null}
          {post.text_content ? <p className="post-text">{post.text_content}</p> : null}
          {post.kind !== "text" && mediaUrl ? (
            <div className="media">
              {post.kind === "image" ? (
                <img src={mediaUrl} alt={post.title ?? "Post media"} style={{ width: "100%", display: "block" }} />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  preload="metadata"
                  style={{ width: "100%", display: "block" }}
                  aria-label="Video attachment"
                />
              )}
            </div>
          ) : null}
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="rating">
              <strong>{post.avg_rating ? post.avg_rating.toFixed(2) : "—"}</strong>
              <span className="muted">
                /5 · {post.rating_count} vote{post.rating_count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="muted">
              Owner: {post.user_id.slice(0, 6)}…{post.user_id.slice(-4)}
            </div>
          </div>
          <RatingWidget
            postId={post.id}
            initialValue={post.user_rating}
            canRate={Boolean(userId)}
            initialAvg={post.avg_rating}
            initialCount={post.rating_count}
          />
          {isOwner ? <DeleteButton postId={post.id} redirectTo="/" /> : null}
        </div>
      </article>
    </main>
  );
}
