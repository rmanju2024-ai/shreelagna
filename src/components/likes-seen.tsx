"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const LIKES_SEEN_COOKIE = "sl_likes_seen";

/** Marks the Likes page as seen so the header badge only counts interests that arrive afterwards. */
export function LikesSeen() {
  const router = useRouter();
  useEffect(() => {
    document.cookie = `${LIKES_SEEN_COOKIE}=${new Date().toISOString()}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
