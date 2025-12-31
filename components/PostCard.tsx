/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { buildPublicMediaUrl } from "@/lib/media";
import type { PostWithStats } from "@/lib/types";

import { RatingWidget } from "./RatingWidget";

type PostCardProps = {
  post: PostWithStats;
  userId?: string | null;
  showActions?: boolean;
};

export function PostCard({ post, userId, showActions }: PostCardProps) {
  const mediaUrl = buildPublicMediaUrl(post.media_path);
  const created = new Date(post.created_at);

  return (
    <article className="panel card">
      <div className="card-meta">
        <div className="row">
          <span className="badge">{post.kind.toUpperCase()}</span>
          <span className="pill small">Owner: {post.user_id.slice(0, 6)}…</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="muted">{created.toLocaleString()}</span>
          <Link className="pill" href={`/p/${post.id}`}>
            Open ↗
          </Link>
        </div>
      </div>

      <div className="stack" style={{ marginTop: 10 }}>
        {post.title ? <h3 className="card-title">{post.title}</h3> : null}
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
            <span className="stat small">
              {post.rating_count > 0 ? post.avg_rating.toFixed(2) : "—"}/5 · {post.rating_count} vote
              {post.rating_count === 1 ? "" : "s"}
            </span>
          </div>
          {showActions ? null : (
            <span className="muted">{post.user_rating ? `You rated ${post.user_rating}` : "Not rated"}</span>
          )}
        </div>

        {showActions ? (
          <RatingWidget
            postId={post.id}
            initialValue={post.user_rating}
            canRate={Boolean(userId)}
            initialAvg={post.avg_rating}
            initialCount={post.rating_count}
          />
        ) : null}
      </div>
    </article>
  );
}
