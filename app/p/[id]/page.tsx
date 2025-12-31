/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { DeleteButton } from "@/components/DeleteButton";
import { RatingWidget } from "@/components/RatingWidget";
import { buildPublicMediaUrl } from "@/lib/media";
import { formatProfileName } from "@/lib/profile";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_path")
    .eq("id", record.user_id)
    .maybeSingle();

  const userId = userData.user?.id ?? null;
  const post = { ...toPostWithStats(record, userId), profile: profile ?? null };
  const mediaUrl = buildPublicMediaUrl(post.media_path);
  const created = new Date(post.created_at);
  const isOwner = userId === post.user_id;

  return (
    <main className="stack">
      <article className="panel card" style={{ padding: 20 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <Link
            className="row"
            style={{ gap: 12, alignItems: "center", textDecoration: "none" }}
            href={`/u/${post.user_id}`}
          >
            <Avatar profile={post.profile} size={48} />
            <div className="stack" style={{ gap: 2 }}>
              <span className="pill soft">{formatProfileName(post.profile)}</span>
              <span className="muted" style={{ fontSize: 12 }}>
                {created.toLocaleString()}
              </span>
            </div>
            <span className="badge">{post.kind.toUpperCase()}</span>
          </Link>
          <Link className="pill" href={`/u/${post.user_id}`}>
            View profile ↗
          </Link>
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
            <Link className="pill soft" href={`/u/${post.user_id}`}>
              {formatProfileName(post.profile)}
            </Link>
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
