"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useJobsRealtime } from "@/lib/hooks/useJobsRealtime";
import { JobStatusBadge } from "./JobStatusBadge";
import { formatDuration, formatRelative } from "@/lib/url";
import type { Job } from "@/lib/types";

export function JobsList({
  projectId,
  initialJobs,
}: {
  projectId: string;
  initialJobs: Job[];
}) {
  const jobs = useJobsRealtime(projectId, initialJobs);

  if (jobs.length === 0) {
    return (
      <div className="card-base p-6 text-center">
        <div className="font-body text-xs text-muted uppercase tracking-widest">
          No jobs yet — queue a video above
        </div>
      </div>
    );
  }

  return (
    <div className="card-base divide-y divide-border">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/projects/${projectId}/jobs/${job.id}`}
          className="flex items-center gap-4 px-4 py-3 hover:bg-bg transition group"
        >
          <JobStatusBadge status={job.status} />
          <div className="min-w-0 flex-1">
            <div className="font-head font-bold text-sm tracking-tightest truncate">
              {job.video_title || job.url || "Untitled video"}
            </div>
            <div className="font-body text-[10px] uppercase tracking-widest text-muted mt-0.5 truncate">
              {formatRelative(job.created_at)}
              {job.duration_secs ? ` · ${formatDuration(job.duration_secs)}` : ""}
              {job.error_message ? (
                <span className="text-danger ml-2">· {job.error_message}</span>
              ) : null}
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-muted group-hover:text-accent transition shrink-0"
          />
        </Link>
      ))}
    </div>
  );
}
