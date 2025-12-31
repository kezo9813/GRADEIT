/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { buildPublicMediaUrl } from "@/lib/media";
import { formatProfileName } from "@/lib/profile";
import type { PostWithStats } from "@/lib/types";

import { RatingList } from "./RatingList";
import { RateForm } from "./RateForm";

type PostCardProps = {
  post: PostWithStats;
  userId?: string | null;
  showActions?: boolean;
};

export function PostCard({ post, userId, showActions }: PostCardProps) {
  const mediaUrl = buildPublicMediaUrl(post.media_path);
  const created = new Date(post.created_at);
  const userRating = post.ratings_with_profiles?.find((r) => r.user_id === userId);

  return (
    <article className="panel card">
      <div className="card-meta">
        <Link href={`/u/${post.user_id}`} className="row" style={{ textDecoration: "none" }}>
          <Avatar profile={post.profile} size={42} />
          <div className="stack" style={{ gap: 2 }}>
            <span className="pill soft">{formatProfileName(post.profile)}</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {created.toLocaleString()}
            </span>
          </div>
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge">{post.kind.toUpperCase()}</span>
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
        </div>

        {showActions ? (
          <>
            <RateForm
              postId={post.id}
              initialValue={post.user_rating}
              initialComment={userRating?.comment ?? null}
              canRate={Boolean(userId)}
            />
            <RatingList ratings={post.ratings_with_profiles ?? []} />
          </>
        ) : null}
      </div>
    </article>
  );
}
