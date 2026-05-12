import { AtSign, MonitorPlay, Tv } from "lucide-react";
import type { Creator } from "@/lib/types";

type CreatorLite = Pick<Creator, "id" | "name" | "platform" | "channel_url">;

const PLATFORM_ICON: Record<string, typeof MonitorPlay> = {
  youtube: MonitorPlay,
  twitch: Tv,
};

export function CreatorChip({
  creator,
  size = "sm",
}: {
  creator: CreatorLite | null;
  size?: "sm" | "md";
}) {
  if (!creator || !creator.name) return null;
  const Icon =
    PLATFORM_ICON[(creator.platform ?? "").toLowerCase()] ?? AtSign;

  const padding = size === "md" ? "px-3 py-1.5" : "px-2 py-0.5";
  const text = size === "md" ? "text-xs" : "text-[10px]";
  const iconSize = size === "md" ? 12 : 10;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 bg-bg border border-border font-body uppercase tracking-widest text-muted rounded-sm",
        padding,
        text,
      ].join(" ")}
      title={creator.channel_url ?? undefined}
    >
      <Icon size={iconSize} strokeWidth={2} className="text-accent" />
      <span className="truncate max-w-[120px]">{creator.name}</span>
    </span>
  );
}
