import Image from "next/image";

import { buildPublicAvatarUrl } from "@/lib/media";
import type { ProfileRecord } from "@/lib/types";

type AvatarProps = {
  profile?: ProfileRecord | null;
  size?: number;
};

export function Avatar({ profile, size = 40 }: AvatarProps) {
  const src = buildPublicAvatarUrl(profile?.avatar_path);
  const label = profile?.full_name || "User";
  if (src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Image src={src} alt={`${label} avatar`} width={size} height={size} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4de2c6, #7ff1d8)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#071017",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      aria-label={`${label} avatar placeholder`}
    >
      {(profile?.full_name || "U").slice(0, 1).toUpperCase()}
    </div>
  );
}
