"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { formatRelative } from "@/lib/url";

export function ProjectCard({
  project,
  clipCount,
  jobCount,
}: {
  project: Project;
  clipCount: number;
  jobCount: number;
}) {
  const initial = (project.streamer_name || project.name || "?")
    .charAt(0)
    .toUpperCase();
  const isArchived = project.status === "archived";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="card-base block hover:border-accent transition group overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-bg border-b border-border relative overflow-hidden">
        {project.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-head font-bold text-[88px] tracking-tightest leading-none text-accent select-none">
              {initial}
            </span>
          </div>
        )}
        {/* Top-right platform chip */}
        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur border border-border px-2 py-0.5 font-body text-[10px] uppercase tracking-widest text-muted">
          {project.platform || "—"}
        </div>
        {/* Bottom-right status */}
        <div className="absolute bottom-2 right-2">
          <StatusBadge archived={isArchived} />
        </div>
      </div>

      {/* Meta block */}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-head font-bold text-base tracking-tightest truncate">
            {project.streamer_name || project.name || "Untitled"}
          </h3>
          <span className="font-body text-[10px] uppercase tracking-widest text-muted whitespace-nowrap">
            {formatRelative(project.created_at)}
          </span>
        </div>
        {project.name && project.streamer_name && project.name !== project.streamer_name && (
          <div className="font-body text-[11px] text-muted truncate mt-0.5">
            {project.name}
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-border">
          <Metric label="Videos" value={jobCount} />
          <Metric label="Clips" value={clipCount} accent />
        </div>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-body text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div
        className={[
          "font-head font-bold text-lg tracking-tightest tabular-nums leading-tight",
          accent ? "text-accent" : "text-text",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ archived }: { archived: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-body text-[10px] uppercase tracking-widest",
        archived
          ? "bg-bg/90 border border-border text-muted"
          : "bg-accent text-bg",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block w-1.5 h-1.5 rounded-full",
          archived ? "bg-muted" : "bg-bg",
        ].join(" ")}
      />
      {archived ? "Archived" : "Active"}
    </span>
  );
}
