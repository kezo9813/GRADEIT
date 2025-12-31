"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          setStatus("Password must be at least 6 characters.");
          setSubmitting(false);
          return;
        }
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
        });
        if (error) {
          setStatus(error.message);
        } else {
          setStatus("Account created. Redirecting…");
          router.push("/");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus(error.message);
        } else {
          setStatus("Signed in. Redirecting…");
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setStatus("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel card" style={{ padding: 20, maxWidth: 460 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{mode === "signin" ? "Sign in" : "Create account"}</h2>
        <button
          type="button"
          className="btn secondary"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account?" : "Have an account?"}
        </button>
      </div>

      <form onSubmit={submit} className="stack">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        {status ? <div className="muted">{status}</div> : null}
      </form>
    </div>
  );
}
