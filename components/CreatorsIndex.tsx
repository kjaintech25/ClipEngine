import Link from "next/link";
import { AtSign, MonitorPlay, Tv } from "lucide-react";
import type { CreatorWithProjects } from "@/lib/types";

const PLATFORM_ICON: Record<string, typeof MonitorPlay> = {
  youtube: MonitorPlay,
  twitch: Tv,
};

export function CreatorsIndex({
  creators,
  initialError,
}: {
  creators: CreatorWithProjects[];
  initialError: string | null;
}) {
  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6">
          <div className="font-body text-[10px] uppercase tracking-widest text-muted">
            Roster
          </div>
          <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1">
            CREATORS
          </h1>
          <p className="font-body text-xs text-muted mt-2">
            Every streamer you&apos;re clipping, tagged across projects.
          </p>
        </div>
      </div>

      <div className="px-8 py-6">
        {initialError && (
          <div className="card-base p-4 text-danger text-xs mb-6">
            DB error: {initialError}
          </div>
        )}

        {creators.length === 0 ? (
          <div className="card-base p-12 text-center max-w-xl mx-auto mt-12">
            <div className="font-head font-bold text-2xl tracking-tightest">
              NO CREATORS YET
            </div>
            <p className="font-body text-sm text-muted mt-3 max-w-sm mx-auto">
              Creators are tagged automatically when you create a project from a
              YouTube or Twitch URL.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {creators.map((c) => {
              const Icon =
                PLATFORM_ICON[(c.platform ?? "").toLowerCase()] ?? AtSign;
              const projectCount = c.projects?.length ?? 0;
              const clipCount = (c.projects ?? []).reduce(
                (sum, p) => sum + (p.clips?.[0]?.count ?? 0),
                0,
              );
              return (
                <Link
                  key={c.id}
                  href={`/creators/${c.id}`}
                  className="card-base block p-4 hover:border-accent transition"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} strokeWidth={2} className="text-accent shrink-0" />
                    <h3 className="font-head font-bold text-base tracking-tightest truncate">
                      {c.name || "Unnamed"}
                    </h3>
                  </div>
                  <div className="font-body text-[10px] uppercase tracking-widest text-muted mt-1">
                    {c.platform || "platform unknown"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-border">
                    <Metric label="Projects" value={projectCount} />
                    <Metric label="Clips" value={clipCount} accent />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
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
