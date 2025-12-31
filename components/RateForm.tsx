"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RatingStars } from "./RatingStars";

type RateFormProps = {
  postId: string;
  initialValue: number | null;
  initialComment: string | null;
  canRate: boolean;
};

export function RateForm({ postId, initialValue, initialComment, canRate }: RateFormProps) {
  const router = useRouter();
  const [value, setValue] = useState<number | null>(initialValue);
  const [comment, setComment] = useState(initialComment ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (score?: number) => {
    const nextScore = score ?? value;
    if (!nextScore) {
      setStatus("Choose a rating first.");
      return;
    }
    if (!canRate) {
      setStatus("Sign in to rate");
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, value: nextScore, comment }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error ?? "Unable to save rating");
      } else {
        setValue(nextScore);
        setStatus("Saved");
        router.refresh();
      }
    } catch (err) {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel card" style={{ padding: 16 }}>
      <div className="stack">
        <div className="row" style={{ alignItems: "center" }}>
          <RatingStars value={value} onSelect={(score) => submit(score)} disabled={submitting} />
          {status ? <span className="muted">{status}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="comment">Leave a comment (optional)</label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            placeholder="What did you think?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={() => submit()} disabled={submitting}>
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
