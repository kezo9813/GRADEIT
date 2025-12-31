import { buildPublicAvatarUrl } from "./media";
import type { PostWithStats, ProfileRecord } from "./types";

export function attachProfilesToPosts(
  posts: PostWithStats[],
  profiles?: ProfileRecord[] | null,
): PostWithStats[] {
  const map = new Map<string, ProfileRecord>();
  (profiles ?? []).forEach((p) => map.set(p.id, p));
  return posts.map((post) => ({
    ...post,
    profile: map.get(post.user_id) ?? null,
  }));
}

export function formatProfileName(profile?: ProfileRecord | null) {
  return profile?.full_name?.trim() || "Anon";
}

export function getProfileAvatarUrl(profile?: ProfileRecord | null) {
  return buildPublicAvatarUrl(profile?.avatar_path);
}
