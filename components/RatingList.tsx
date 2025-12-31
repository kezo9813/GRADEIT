import { Avatar } from "@/components/Avatar";
import { formatProfileName } from "@/lib/profile";
import type { RatingWithProfile } from "@/lib/types";

type RatingListProps = {
  ratings: RatingWithProfile[];
};

export function RatingList({ ratings }: RatingListProps) {
  if (ratings.length === 0) {
    return (
      <div className="panel card">
        <p className="muted">No votes yet. Be the first to rate.</p>
      </div>
    );
  }

  return (
    <div className="panel card">
      <div className="stack">
        {ratings.map((rating) => {
          const updated = rating.updated_at ? new Date(rating.updated_at) : null;
          return (
            <div key={`${rating.user_id}-${rating.updated_at ?? ""}`} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <Avatar profile={rating.profile} size={36} />
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  flex: 1,
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{formatProfileName(rating.profile)}</strong>
                  <span className="stat small">{rating.value} ★</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {updated ? updated.toLocaleString() : "Recently"}
                </div>
                <div style={{ marginTop: 6 }}>
                  {rating.comment ? (
                    <p className="post-text" style={{ margin: 0 }}>{rating.comment}</p>
                  ) : (
                    <span className="muted">No comment</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
