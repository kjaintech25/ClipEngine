import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import type { Job, ProjectWithCreator } from "@/lib/types";
import { ProcessVideoForm } from "@/components/ProcessVideoForm";
import { JobsList } from "@/components/JobsList";
import { CreatorChip } from "@/components/CreatorChip";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const [projectRes, jobsRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "*, creator:creators(id, name, platform, channel_url)",
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("jobs")
      .select("*")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (projectRes.error || !projectRes.data) {
    return notFound();
  }

  const project = projectRes.data as ProjectWithCreator;
  const jobs = (jobsRes.data ?? []) as Job[];

  return (
    <>
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="px-8 pt-5 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-muted hover:text-accent transition"
          >
            <ChevronLeft size={12} />
            All projects
          </Link>
        </div>
        <div className="px-8 pb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="font-body text-[10px] uppercase tracking-widest text-muted">
              {project.platform || "platform unknown"}{" "}
              {project.status === "archived" && " · archived"}
            </div>
            <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1 truncate">
              {project.streamer_name?.toUpperCase() ||
                project.name?.toUpperCase() ||
                "UNTITLED"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {project.creator && (
                <CreatorChip
                  creator={project.creator}
                  size="md"
                  href={`/creators/${project.creator.id}`}
                />
              )}
              {project.channel_url && (
                <a
                  href={project.channel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-xs text-muted hover:text-accent transition"
                >
                  {project.channel_url}
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6 max-w-4xl">
        {/* Process new video */}
        <section>
          <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted mb-3">
            Process new video
          </h2>
          <ProcessVideoForm projectId={project.id} />
        </section>

        {/* Jobs list */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted">
              Jobs
            </h2>
            <span className="font-body text-[10px] uppercase tracking-widest text-muted tabular-nums">
              {jobs.length} total · live
            </span>
          </div>
          <JobsList projectId={project.id} initialJobs={jobs} />
        </section>
      </div>
    </>
  );
}
