import Image from "next/image";

import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { attachProfilesToPosts } from "@/lib/profile";
import { buildPublicAvatarUrl } from "@/lib/media";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toPostWithStats } from "@/lib/posts";
import type { PostWithRatings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_path, updated_at")
      .eq("id", params.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const profileData = profile ?? { id: params.id, full_name: null, avatar_path: null };

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id,created_at,user_id,kind,title,text_content,media_path,media_mime,video_duration_ms,deleted, ratings:ratings(user_id,value)",
    )
    .eq("deleted", false)
    .eq("user_id", params.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const viewerId = authData?.user?.id ?? null;
  const hydrated = (posts ?? []).map((post) => toPostWithStats(post as PostWithRatings, viewerId));
  const postsWithProfile = attachProfilesToPosts(hydrated, [profileData]);
  const avatarUrl = buildPublicAvatarUrl(profileData.avatar_path);

  return (
    <main className="stack">
      <div className="panel card">
        <div className="row" style={{ alignItems: "center", gap: 16 }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${profileData.full_name ?? "User"} avatar`}
              width={88}
              height={88}
              style={{
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.1)",
                objectFit: "cover",
              }}
            />
          ) : (
            <Avatar profile={profileData} size={88} />
          )}
          <div className="stack" style={{ gap: 4 }}>
            <h1 className="section-title" style={{ margin: 0 }}>
              {profileData.full_name || "Anon"}
            </h1>
            <div className="muted">Posts by this user</div>
          </div>
        </div>
      </div>

      <div className="card-grid">
        {postsWithProfile.length === 0 ? (
          <div className="panel card">
            <p className="muted">No posts yet.</p>
          </div>
        ) : (
          postsWithProfile.map((post) => (
            <PostCard key={post.id} post={post} userId={viewerId} showActions />
          ))
        )}
      </div>
    </main>
  );
}
