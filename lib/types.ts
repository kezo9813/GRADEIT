export type PostKind = "text" | "image" | "video" | "audio";

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  avatar_path: string | null;
  updated_at?: string | null;
};

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
  comment?: string | null;
  updated_at?: string;
};

export type PostWithRatings = PostRecord & {
  ratings?: { user_id: string; value: number; comment?: string | null; updated_at?: string }[];
};

export type PostWithStats = PostRecord & {
  avg_rating: number;
  rating_count: number;
  user_rating: number | null;
  profile?: ProfileRecord | null;
  ratings_with_profiles?: RatingWithProfile[];
};

export type RatingWithProfile = {
  user_id: string;
  value: number;
  comment: string | null;
  updated_at: string | null;
  profile?: ProfileRecord | null;
};
