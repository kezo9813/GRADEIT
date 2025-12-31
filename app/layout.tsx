import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "Grade it",
  description: "Rate anything in seconds.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Header user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}
