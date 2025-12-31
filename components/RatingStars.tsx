"use client";

import { useMemo, useState } from "react";

type RatingStarsProps = {
  value: number | null;
  onSelect?: (value: number) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
};

export function RatingStars({ value, onSelect, disabled, compact }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);

  const activeValue = useMemo(() => {
    if (hover !== null) return hover;
    return value ?? 0;
  }, [hover, value]);

  return (
    <div className="stars" aria-label="rate this post">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => !disabled && onSelect?.(score)}
          onMouseEnter={() => setHover(score)}
          onMouseLeave={() => setHover(null)}
          aria-disabled={disabled}
          title={`Rate ${score}/5`}
          style={{ opacity: disabled ? 0.4 : 1, fontSize: compact ? 16 : 18 }}
        >
          {activeValue >= score ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
