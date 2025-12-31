import type { PostWithRatings, PostWithStats } from "./types";

export function toPostWithStats(
  post: PostWithRatings,
  userId?: string | null,
): PostWithStats {
  const ratings = post.ratings ?? [];
  const ratingCount = ratings.length;
  const avg =
    ratingCount === 0
      ? 0
      : Number(
          (ratings.reduce((sum, r) => sum + (r?.value ?? 0), 0) / ratingCount).toFixed(2),
        );

  const userRating =
    userId && ratings.length
      ? ratings.find((r) => r.user_id === userId)?.value ?? null
      : null;

  return {
    ...post,
    avg_rating: avg,
    rating_count: ratingCount,
    user_rating: userRating,
  };
}
