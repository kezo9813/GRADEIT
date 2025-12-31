import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/ProfileForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="stack" style={{ alignItems: "center" }}>
      <h1 className="section-title">Your profile</h1>
      <ProfileForm userId={user.id} profile={profile ?? null} />
    </main>
  );
}
