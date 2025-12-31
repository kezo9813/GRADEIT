import Image from "next/image";
import Link from "next/link";

import { PostCard } from "@/components/PostCard";
import { attachProfilesToPosts } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toPostWithStats } from "@/lib/posts";
import type { PostWithRatings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const [{ data: userData }, { data: posts, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(
        "id,created_at,user_id,kind,title,text_content,media_path,media_mime,video_duration_ms,deleted, ratings:ratings(user_id,value)",
      )
      .eq("deleted", false)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw error;
  }

  const userId = userData.user?.id ?? null;
  const hydrated = (posts ?? []).map((post) => toPostWithStats(post as PostWithRatings, userId));

  const userIds = Array.from(new Set(hydrated.map((p) => p.user_id)));
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_path")
          .in("id", userIds)
      : { data: [] };

  const postsWithProfiles = attachProfilesToPosts(hydrated, profiles);

  return (
    <main className="stack">
      <div className="panel card center-logo">
        <div className="hero-logo">
          <Image src="/logo.png" alt="Grade it logo" width={200} height={200} priority />
        </div>
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
