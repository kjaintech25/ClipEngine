"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { PostWithClip } from "@/lib/types";

/**
 * Subscribes to the posts table. New rows arrive without their clip join,
 * so the caller passes a resolver to hydrate clip data for inserts.
 */
export function usePostsRealtime(initial: PostWithClip[]) {
  const [posts, setPosts] = useState<PostWithClip[]>(initial);

  useEffect(() => {
    setPosts(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("posts:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((p) => p.id !== (payload.old as { id: string }).id);
            }
            const row = payload.new as PostWithClip;
            const existing = prev.find((p) => p.id === row.id);
            if (existing) {
              // Preserve the clip join we already have; only status/meta changed.
              return prev.map((p) =>
                p.id === row.id ? { ...row, clip: existing.clip } : p,
              );
            }
            return [{ ...row, clip: null }, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return posts;
}
