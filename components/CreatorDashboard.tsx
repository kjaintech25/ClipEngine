import Link from "next/link";
import { AtSign, ChevronLeft, ExternalLink, MonitorPlay, Tv } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import type { Creator, ProjectWithCounts } from "@/lib/types";

const PLATFORM_ICON: Record<string, typeof MonitorPlay> = {
  youtube: MonitorPlay,
  twitch: Tv,
};

export function CreatorDashboard({
  creator,
  projects,
  approvedCount,
}: {
  creator: Creator;
  projects: ProjectWithCounts[];
  approvedCount: number;
}) {
  const Icon = PLATFORM_ICON[(creator.platform ?? "").toLowerCase()] ?? AtSign;

  const totalClips = projects.reduce(
    (sum, p) => sum + (p.clips?.[0]?.count ?? 0),
    0,
  );
  const totalJobs = projects.reduce(
    (sum, p) => sum + (p.jobs?.[0]?.count ?? 0),
    0,
  );

  const hasScoutData =
    creator.subscriber_count != null ||
    creator.avg_viewers != null ||
    creator.monthly_growth_pct != null ||
    creator.opportunity_score != null;

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="px-8 pt-5 pb-2">
          <Link
            href="/creators"
            className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-muted hover:text-accent transition"
          >
            <ChevronLeft size={12} />
            All creators
          </Link>
        </div>
        <div className="px-8 pb-6">
          <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-muted">
            <Icon size={12} strokeWidth={2} className="text-accent" />
            {creator.platform || "platform unknown"}
          </div>
          <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1">
            {(creator.name || "UNNAMED").toUpperCase()}
          </h1>
          {creator.channel_url && (
            <a
              href={creator.channel_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 font-body text-xs text-muted hover:text-accent transition"
            >
              {creator.channel_url}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="px-8 pb-5 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          <Stat label="Projects" value={projects.length} />
          <Stat label="Videos processed" value={totalJobs} />
          <Stat label="Clips generated" value={totalClips} />
          <Stat label="Clips approved" value={approvedCount} accent />
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6">
        {/* Scout metadata */}
        <section>
          <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted mb-3">
            Scout data
          </h2>
          {hasScoutData ? (
            <div className="card-base p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScoutStat label="Subscribers" value={fmtNum(creator.subscriber_count)} />
              <ScoutStat label="Avg viewers" value={fmtNum(creator.avg_viewers)} />
              <ScoutStat
                label="Monthly growth"
                value={
                  creator.monthly_growth_pct != null
                    ? `${creator.monthly_growth_pct}%`
                    : "—"
                }
              />
              <ScoutStat
                label="Opportunity"
                value={
                  creator.opportunity_score != null
                    ? `${creator.opportunity_score}/100`
                    : "—"
                }
              />
              {creator.score_reason && (
                <p className="col-span-2 md:col-span-4 font-body text-xs italic text-muted border-l-2 border-accent pl-3">
                  {creator.score_reason}
                </p>
              )}
            </div>
          ) : (
            <div className="card-base p-4 font-body text-xs text-muted">
              No Scout data yet — discover + score this creator via Scout (V3).
            </div>
          )}
        </section>

        {/* Projects */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted">
              Projects
            </h2>
            <span className="font-body text-[10px] uppercase tracking-widest text-muted tabular-nums">
              {projects.length} total
            </span>
          </div>
          {projects.length === 0 ? (
            <div className="card-base p-6 text-center font-body text-xs text-muted uppercase tracking-widest">
              No projects for this creator yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  clipCount={p.clips?.[0]?.count ?? 0}
                  jobCount={p.jobs?.[0]?.count ?? 0}
                  creator={null}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function fmtNum(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
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

function ScoutStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-body text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="font-head font-bold text-lg tracking-tightest tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}
