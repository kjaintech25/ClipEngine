"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Clip } from "@/lib/types";

export function useClipsRealtime(jobId: string, initial: Clip[]) {
  const [clips, setClips] = useState<Clip[]>(initial);

  useEffect(() => {
    setClips(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`clips:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clips",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setClips((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Clip;
              if (prev.some((c) => c.id === next.id)) return prev;
              return [...prev, next].sort(
                (a, b) => (a.start_time ?? 0) - (b.start_time ?? 0),
              );
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Clip;
              return prev.map((c) => (c.id === next.id ? next : c));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Clip;
              return prev.filter((c) => c.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return clips;
}
