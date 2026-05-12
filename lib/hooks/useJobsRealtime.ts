"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Job } from "@/lib/types";

export function useJobsRealtime(projectId: string, initial: Job[]) {
  const [jobs, setJobs] = useState<Job[]>(initial);

  useEffect(() => {
    setJobs(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`jobs:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setJobs((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Job;
              if (prev.some((j) => j.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Job;
              return prev.map((j) => (j.id === next.id ? next : j));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Job;
              return prev.filter((j) => j.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return jobs;
}
