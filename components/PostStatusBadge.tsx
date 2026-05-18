import { CheckCircle2, Clock, Loader2, Send, XCircle } from "lucide-react";

const MAP: Record<
  string,
  { label: string; tone: string; Icon: typeof Clock; spin?: boolean }
> = {
  queued: { label: "Queued", tone: "bg-bg border-border text-muted", Icon: Clock },
  scheduled: {
    label: "Scheduled",
    tone: "bg-warn/10 border-warn/40 text-warn",
    Icon: Clock,
  },
  posting: {
    label: "Posting",
    tone: "bg-accent text-bg border-accent",
    Icon: Loader2,
    spin: true,
  },
  posted: {
    label: "Posted",
    tone: "bg-success/15 border-success/40 text-success",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    tone: "bg-danger/10 border-danger/40 text-danger",
    Icon: XCircle,
  },
};

export function PostStatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? {
    label: status,
    tone: "bg-bg border-border text-muted",
    Icon: Send,
  };
  const { Icon } = m;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 border font-body text-[10px] uppercase tracking-widest rounded-sm whitespace-nowrap",
        m.tone,
      ].join(" ")}
    >
      <Icon size={11} strokeWidth={2.5} className={m.spin ? "animate-spin" : ""} />
      {m.label}
    </span>
  );
}
