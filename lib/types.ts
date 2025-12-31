export type PostKind = "text" | "image" | "video";

export type PostRecord = {
  id: string;
  created_at: string;
  user_id: string;
  kind: PostKind;
  title: string | null;
  text_content: string | null;
  media_path: string | null;
  media_mime: string | null;
  video_duration_ms: number | null;
  deleted: boolean;
};

export type RatingRecord = {
  id: string;
  post_id: string;
  user_id: string;
  value: number;
};

export type PostWithRatings = PostRecord & {
  ratings?: { user_id: string; value: number }[];
};

export type PostWithStats = PostRecord & {
  avg_rating: number;
  rating_count: number;
  user_rating: number | null;
};
