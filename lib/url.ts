import type { Platform } from "./types";

export function parseStreamerUrl(raw: string): {
  platform: Platform;
  streamer_name: string | null;
  channel_url: string | null;
} {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);

    if (host.endsWith("youtube.com") || host === "youtu.be") {
      let name: string | null = null;
      let channelUrl: string | null = null;
      if (parts[0]?.startsWith("@")) {
        name = parts[0].slice(1);
        channelUrl = `https://www.youtube.com/${parts[0]}`;
      } else if (parts[0] === "c" || parts[0] === "channel" || parts[0] === "user") {
        name = parts[1] ?? null;
        if (name) channelUrl = `https://www.youtube.com/${parts[0]}/${name}`;
      }
      return { platform: "youtube", streamer_name: name, channel_url: channelUrl };
    }

    if (host.endsWith("twitch.tv")) {
      const name = parts[0] ?? null;
      return {
        platform: "twitch",
        streamer_name: name,
        channel_url: name ? `https://www.twitch.tv/${name}` : null,
      };
    }

    return { platform: "unknown", streamer_name: null, channel_url: null };
  } catch {
    return { platform: "unknown", streamer_name: null, channel_url: null };
  }
}

export function formatDuration(secs: number | null | undefined): string {
  if (!secs && secs !== 0) return "—";
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
