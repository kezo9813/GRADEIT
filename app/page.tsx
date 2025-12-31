import Image from "next/image";
import Link from "next/link";

import { PostCard } from "@/components/PostCard";
import { attachProfilesToPosts } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toPostWithStats } from "@/lib/posts";
import type { PostWithRatings, RatingWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const [{ data: userData }, { data: posts, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(
        "id,created_at,user_id,kind,title,text_content,media_path,media_mime,video_duration_ms,deleted, ratings:ratings(user_id,value,comment,updated_at)",
      )
      .eq("deleted", false)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw error;
  }

  const userId = userData.user?.id ?? null;
  const hydrated = (posts ?? []).map((post) => toPostWithStats(post as PostWithRatings, userId));

  const postIds = hydrated.map((p) => p.id);
  const userIds = Array.from(new Set(hydrated.map((p) => p.user_id)));

  const [{ data: profiles }, { data: ratingRows }] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, avatar_path, updated_at")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase
          .from("ratings")
          .select("post_id, user_id, value, comment, updated_at")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ratingUserIds = Array.from(new Set((ratingRows ?? []).map((r) => r.user_id)));
  const { data: ratingProfiles } =
    ratingUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_path, updated_at")
          .in("id", ratingUserIds)
      : { data: [] };

  const ratingsByPost = new Map<string, RatingWithProfile[]>();
  (ratingRows ?? []).forEach((r) => {
    const arr = ratingsByPost.get(r.post_id) ?? [];
    arr.push({ ...r, profile: ratingProfiles?.find((p) => p.id === r.user_id) ?? null });
    ratingsByPost.set(r.post_id, arr);
  });

  const postsWithProfiles = attachProfilesToPosts(hydrated, profiles).map((p) => ({
    ...p,
    ratings_with_profiles: ratingsByPost.get(p.id) ?? [],
  }));

  return (
    <main className="stack">
      <div className="panel card center-logo">
        <div className="hero-logo">
          <Image src="/logo.png" alt="Grade it logo" width={200} height={200} priority />
        </div>
        <p className="muted" style={{ marginTop: 12, marginLeft: 12, textAlign: "center" }}>
          Faites place à la folie, uploadez du contenu et jugez-vous…
        </p>
      </div>

      <div className="card-grid">
        {hydrated.length === 0 ? (
          <div className="panel card">
            <p className="muted">No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          postsWithProfiles.map((post) => <PostCard key={post.id} post={post} userId={userId} showActions />)
        )}
      </div>
    </main>
  );
}
