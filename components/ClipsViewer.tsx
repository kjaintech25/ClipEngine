"use client";

import { useState } from "react";
import { CheckCheck, Loader2, RotateCw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useJobStatus } from "@/lib/hooks/useJobStatus";
import { useClipsRealtime } from "@/lib/hooks/useClipsRealtime";
import { JobStatusBadge } from "./JobStatusBadge";
import { ClipCard } from "./ClipCard";
import type { Clip, Job } from "@/lib/types";

export function ClipsViewer({
  initialJob,
  initialClips,
}: {
  initialJob: Job;
  initialClips: Clip[];
}) {
  const job = useJobStatus(initialJob);
  const clips = useClipsRealtime(initialJob.id, initialClips);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  const approvedCount = clips.filter((c) => c.approved).length;

  async function bulkApprove() {
    if (bulkLoading || clips.length === 0) return;
    setBulkLoading(true);
    const supabase = supabaseBrowser();
    const ids = clips.filter((c) => !c.approved).map((c) => c.id);
    if (ids.length > 0) {
      await supabase.from("clips").update({ approved: true }).in("id", ids);
    }
    setBulkLoading(false);
  }

  async function retryJob() {
    if (retryLoading) return;
    setRetryLoading(true);
    const supabase = supabaseBrowser();
    await supabase
      .from("jobs")
      .update({ status: "pending", error_message: null })
      .eq("id", job.id);
    setRetryLoading(false);
  }

  return (
    <>
      {/* Status banner */}
      <div className="px-8 pt-6">
        <div className="card-base flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <JobStatusBadge status={job.status} />
            <div className="font-body text-xs text-muted">
              {job.status === "processing" &&
                "Processor is running — clips will appear here as they're generated."}
              {job.status === "pending" &&
                "Waiting for the Python processor to pick up this job."}
              {job.status === "done" &&
                `${clips.length} clips generated · ${approvedCount} approved.`}
              {job.status === "failed" &&
                (job.error_message || "Job failed. Check the processor logs.")}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {job.status === "failed" && (
              <button
                onClick={retryJob}
                className="btn-ghost disabled:opacity-50"
                disabled={retryLoading}
              >
                {retryLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCw size={14} strokeWidth={2} />
                )}
                <span>{retryLoading ? "Retrying…" : "Retry"}</span>
              </button>
            )}
            {clips.length > 0 && (
              <button
                onClick={bulkApprove}
                className="btn-accent disabled:opacity-50"
                disabled={bulkLoading || approvedCount === clips.length}
              >
                {bulkLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Approving…</span>
                  </>
                ) : (
                  <>
                    <CheckCheck size={14} strokeWidth={2.5} />
                    <span>Approve all ({clips.length - approvedCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {clips.length === 0 ? (
          <EmptyClips status={job.status} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyClips({ status }: { status: string }) {
  return (
    <div className="card-base p-12 text-center max-w-xl mx-auto mt-6">
      {status === "processing" ? (
        <>
          <Loader2
            size={28}
            className="mx-auto text-accent animate-spin mb-4"
            strokeWidth={2}
          />
          <div className="font-head font-bold text-xl tracking-tightest">
            GENERATING CLIPS…
          </div>
          <p className="font-body text-xs text-muted mt-3 max-w-sm mx-auto">
            Transcript → Claude → ffmpeg → Supabase Storage. Clips will appear
            live as each one finishes.
          </p>
        </>
      ) : status === "failed" ? (
        <>
          <div className="font-head font-bold text-xl tracking-tightest text-danger">
            JOB FAILED
          </div>
          <p className="font-body text-xs text-muted mt-3 max-w-sm mx-auto">
            No clips were generated. Check the processor logs, then hit Retry in
            the banner above to re-queue this job.
          </p>
        </>
      ) : (
        <>
          <div className="font-head font-bold text-xl tracking-tightest">
            QUEUED
          </div>
          <p className="font-body text-xs text-muted mt-3 max-w-sm mx-auto">
            The processor will pick this up on its next poll.
          </p>
        </>
      )}
    </div>
  );
}
