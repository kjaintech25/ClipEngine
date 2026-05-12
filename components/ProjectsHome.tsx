"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import type { ProjectWithClipCount } from "@/lib/types";

type ProjectWithCounts = ProjectWithClipCount & { jobs: { count: number }[] };

export function ProjectsHome({
  projects,
  initialError,
}: {
  projects: ProjectWithCounts[];
  initialError: string | null;
}) {
  const [open, setOpen] = useState(false);

  const totalClips = projects.reduce(
    (sum, p) => sum + (p.clips?.[0]?.count ?? 0),
    0,
  );
  const totalJobs = projects.reduce(
    (sum, p) => sum + (p.jobs?.[0]?.count ?? 0),
    0,
  );
  const activeCount = projects.filter((p) => p.status !== "archived").length;

  return (
    <>
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6 flex items-end justify-between">
          <div>
            <div className="font-body text-[10px] uppercase tracking-widest text-muted">
              Dashboard
            </div>
            <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1">
              PROJECTS
            </h1>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn-accent"
            aria-label="New project"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>
        <div className="px-8 pb-5 grid grid-cols-3 gap-4 max-w-3xl">
          <Stat label="Active projects" value={activeCount} />
          <Stat label="Videos processed" value={totalJobs} />
          <Stat label="Clips generated" value={totalClips} accent />
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 py-6">
        {initialError && (
          <div className="card-base p-4 text-danger text-xs mb-6">
            DB error: {initialError}
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState onCreate={() => setOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                clipCount={p.clips?.[0]?.count ?? 0}
                jobCount={p.jobs?.[0]?.count ?? 0}
              />
            ))}
          </div>
        )}
      </div>

      {open && <NewProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card-base px-4 py-3">
      <div className="font-body text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div
        className={[
          "font-head font-bold text-2xl tracking-tightest mt-1 tabular-nums",
          accent ? "text-accent" : "text-text",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card-base p-12 text-center max-w-xl mx-auto mt-12">
      <div className="font-head font-bold text-2xl tracking-tightest">
        NO PROJECTS YET
      </div>
      <p className="font-body text-sm text-muted mt-3 max-w-sm mx-auto">
        Drop a streamer URL — YouTube channel or Twitch — and ClipEngine will
        process their next video into 30 viral candidates.
      </p>
      <div className="mt-6">
        <button onClick={onCreate} className="btn-accent">
          <Plus size={14} strokeWidth={2.5} />
          <span>Create first project</span>
        </button>
      </div>
    </div>
  );
}
