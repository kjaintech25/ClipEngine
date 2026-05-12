import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

const MAP: Record<
  string,
  { label: string; tone: "muted" | "warn" | "accent" | "danger" | "success"; Icon: typeof CircleDashed }
> = {
  pending: { label: "Pending", tone: "muted", Icon: CircleDashed },
  processing: { label: "Processing", tone: "accent", Icon: Loader2 },
  done: { label: "Done", tone: "success", Icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", Icon: XCircle },
};

const TONES: Record<string, string> = {
  muted: "bg-bg border-border text-muted",
  warn: "bg-warn/10 border-warn/40 text-warn",
  accent: "bg-accent text-bg border-accent",
  danger: "bg-danger/10 border-danger/40 text-danger",
  success: "bg-success/15 border-success/40 text-success",
};

export function JobStatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? {
    label: status,
    tone: "muted" as const,
    Icon: CircleDashed,
  };
  const { Icon } = m;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 border font-body text-[10px] uppercase tracking-widest rounded-sm whitespace-nowrap",
        TONES[m.tone],
      ].join(" ")}
    >
      <Icon
        size={11}
        strokeWidth={2.5}
        className={status === "processing" ? "animate-spin" : ""}
      />
      {m.label}
    </span>
  );
}
