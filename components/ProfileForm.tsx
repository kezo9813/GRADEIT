"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProfileRecord } from "@/lib/types";
import { buildPublicAvatarUrl } from "@/lib/media";

type ProfileFormProps = {
  userId: string;
  profile: ProfileRecord | null;
};

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

export function ProfileForm({ userId, profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const avatarUrl = buildPublicAvatarUrl(profile?.avatar_path);

  const handleFile = (f: File | null) => {
    setFile(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setStatus("Avatar must be an image.");
      return;
    }
    if (f.size > MAX_AVATAR_BYTES) {
      setStatus("Avatar must be 3MB or less.");
      return;
    }
    setFile(f);
    setStatus(null);
  };

  const save = async () => {
    setSubmitting(true);
    setStatus(null);
    let newAvatarPath: string | null = profile?.avatar_path ?? null;

    try {
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `${userId}/avatar_${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) {
          if (uploadError.message.toLowerCase().includes("bucket not found")) {
            setStatus('Bucket "avatars" not found. Re-run supabase.sql or create a public bucket named avatars.');
          } else {
            setStatus(uploadError.message);
          }
          setSubmitting(false);
          return;
        }
        // optionally remove old avatar
        if (profile?.avatar_path && profile.avatar_path !== path) {
          await supabase.storage.from("avatars").remove([profile.avatar_path]);
        }
        newAvatarPath = path;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: userId, full_name: name || null, avatar_path: newAvatarPath });

      if (upsertError) {
        setStatus(upsertError.message);
        return;
      }

      setStatus("Profile updated");
      router.refresh();
    } catch (err) {
      setStatus("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel card" style={{ padding: 20, maxWidth: 600 }}>
      <div className="stack">
        <div className="row" style={{ alignItems: "center", gap: 16 }}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Current avatar"
              width={80}
              height={80}
              style={{ borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4de2c6, #7ff1d8)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#071017",
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {(name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="stack" style={{ gap: 6 }}>
            <label htmlFor="avatar">Profile photo</label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="muted">Image only, up to 3MB.</div>
            {file ? <div className="muted">Selected: {file.name}</div> : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="full_name">Display name</label>
          <input
            id="full_name"
            name="full_name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button className="btn" type="button" onClick={save} disabled={submitting}>
          {submitting ? "Saving..." : "Save profile"}
        </button>
        {status ? <div className="muted">{status}</div> : null}
      </div>
    </div>
  );
}
