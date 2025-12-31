"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteButtonProps = {
  postId: string;
  redirectTo?: string;
};

export function DeleteButton({ postId, redirectTo = "/" }: DeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/delete`, { method: "POST" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error ?? "Unable to delete");
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <button className="btn danger" type="button" onClick={onDelete} disabled={submitting}>
        {submitting ? "Deleting..." : "Delete post"}
      </button>
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}
