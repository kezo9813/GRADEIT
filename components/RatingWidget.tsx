"use client";

import { useState } from "react";

import { RatingStars } from "./RatingStars";

type RatingWidgetProps = {
  postId: string;
  initialValue: number | null;
  canRate: boolean;
  initialAvg: number;
  initialCount: number;
};

export function RatingWidget({
  postId,
  initialValue,
  canRate,
  initialAvg,
  initialCount,
}: RatingWidgetProps) {
  const [value, setValue] = useState<number | null>(initialValue);
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (score: number) => {
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
        body: JSON.stringify({ postId, value: score }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error ?? "Unable to save rating");
      } else {
        setValue(payload.value);
        setAvg(payload.avg);
        setCount(payload.count);
        setStatus("Saved");
      }
    } catch (err) {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="row" style={{ alignItems: "center" }}>
        <RatingStars value={value} onSelect={handleSelect} disabled={submitting} />
        <div className="muted">
          {avg ? `${avg.toFixed(2)}/5 · ${count} vote${count === 1 ? "" : "s"}` : "No ratings yet"}
        </div>
      </div>
      {status ? <div className="muted" style={{ marginTop: 4 }}>{status}</div> : null}
    </div>
  );
}
