import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import type { Clip, Job } from "@/lib/types";
import { ClipsViewer } from "@/components/ClipsViewer";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: { id: string; jobId: string };
}) {
  const supabase = supabaseServer();

  const [jobRes, clipsRes] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", params.jobId).single(),
    supabase
      .from("clips")
      .select("*")
      .eq("job_id", params.jobId)
      .order("start_time", { ascending: true }),
  ]);

  if (jobRes.error || !jobRes.data) {
    return notFound();
  }

  const job = jobRes.data as Job;
  const clips = (clipsRes.data ?? []) as Clip[];

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="px-8 pt-5 pb-2">
          <Link
            href={`/projects/${params.id}`}
            className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-muted hover:text-accent transition"
          >
            <ChevronLeft size={12} />
            Back to project
          </Link>
        </div>
        <div className="px-8 pb-5">
          <div className="font-body text-[10px] uppercase tracking-widest text-muted">
            Source
          </div>
          <h1 className="font-head font-bold text-[28px] tracking-tightest leading-none mt-1 break-all">
            {job.video_title || job.url || "Untitled"}
          </h1>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 font-body text-xs text-muted hover:text-accent transition break-all"
            >
              {job.url}
              <ExternalLink size={11} className="shrink-0" />
            </a>
          )}
        </div>
      </div>

      <ClipsViewer initialJob={job} initialClips={clips} />
    </>
  );
}
