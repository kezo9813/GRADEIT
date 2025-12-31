import { redirect } from "next/navigation";

import { NewPostForm } from "@/components/NewPostForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="stack">
      <h1 className="section-title">Create a post</h1>
      <NewPostForm />
    </main>
  );
}
