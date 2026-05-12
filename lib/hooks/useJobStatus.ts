"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Job } from "@/lib/types";

export function useJobStatus(initial: Job): Job {
  const [job, setJob] = useState<Job>(initial);

  useEffect(() => {
    setJob(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`job:${initial.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${initial.id}`,
        },
        (payload) => {
          setJob(payload.new as Job);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id]);

  return job;
}
