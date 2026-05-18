"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ExternalLink, Loader2, Send, Zap } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { usePostsRealtime } from "@/lib/hooks/usePostsRealtime";
import { PostStatusBadge } from "./PostStatusBadge";
import { formatRelative } from "@/lib/url";
import type { ApprovedClip, PostWithClip } from "@/lib/types";

const PLATFORMS: { id: string; label: string; enabled: boolean }[] = [
  { id: "youtube_shorts", label: "YouTube Shorts", enabled: true },
  { id: "tiktok", label: "TikTok", enabled: false },
  { id: "instagram_reels", label: "Reels", enabled: false },
];

function postUrl(post: PostWithClip): string | null {
  if (!post.platform_post_id) return null;
  if (post.platform === "youtube_shorts") {
    return `https://youtube.com/shorts/${post.platform_post_id}`;
  }
  return null;
}

export function PostManager({
  initialQueue,
  initialPosts,
}: {
  initialQueue: ApprovedClip[];
  initialPosts: PostWithClip[];
}) {
  const posts = usePostsRealtime(initialPosts);

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6">
          <div className="font-body text-[10px] uppercase tracking-widest text-muted">
            V4 · Auto-post
          </div>
          <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1">
            POSTS
          </h1>
          <p className="font-body text-xs text-muted mt-2">
            Approved clips, queued and scheduled. The processor publishes them.
          </p>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-8 max-w-5xl">
        {/* Queue */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted">
              Queue · approved &amp; unposted
            </h2>
            <span className="font-body text-[10px] uppercase tracking-widest text-muted tabular-nums">
              {initialQueue.length} clips
            </span>
          </div>
          {initialQueue.length === 0 ? (
            <div className="card-base p-6 text-center font-body text-xs text-muted uppercase tracking-widest">
              No approved clips waiting — approve clips in a job to queue them
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {initialQueue.map((clip) => (
                <QueueCard key={clip.id} clip={clip} />
              ))}
            </div>
          )}
        </section>

        {/* Published */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-head font-bold text-sm uppercase tracking-widest text-muted">
              Published &amp; scheduled
            </h2>
            <span className="font-body text-[10px] uppercase tracking-widest text-muted tabular-nums">
              {posts.length} posts
            </span>
          </div>
          {posts.length === 0 ? (
            <div className="card-base p-6 text-center font-body text-xs text-muted uppercase tracking-widest">
              Nothing posted yet
            </div>
          ) : (
            <div className="card-base divide-y divide-border">
              {posts.map((post) => {
                const url = postUrl(post);
                return (
                  <div key={post.id} className="flex items-center gap-4 px-4 py-3">
                    <PostStatusBadge status={post.status} />
                    <div className="min-w-0 flex-1">
                      <div className="font-head font-bold text-sm tracking-tightest truncate">
                        {post.title_used || post.clip?.title || "Untitled clip"}
                      </div>
                      <div className="font-body text-[10px] uppercase tracking-widest text-muted mt-0.5 truncate">
                        {post.platform.replace("_", " ")}
                        {post.status === "scheduled" && post.scheduled_for
                          ? ` · for ${new Date(post.scheduled_for).toLocaleString()}`
                          : ""}
                        {post.status === "posted" && post.posted_at
                          ? ` · ${formatRelative(post.posted_at)}`
                          : ""}
                        {post.error_message ? (
                          <span className="text-danger ml-1">
                            · {post.error_message}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost shrink-0"
                      >
                        <ExternalLink size={13} />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function QueueCard({ clip }: { clip: ApprovedClip }) {
  const router = useRouter();
  const [platform, setPlatform] = useState("youtube_shorts");
  const [title, setTitle] = useState(clip.title ?? "");
  const [description, setDescription] = useState(clip.description ?? "");
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    if (mode === "schedule" && !scheduledFor) {
      setError("Pick a date + time to schedule.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("posts").insert({
      clip_id: clip.id,
      platform,
      status: mode === "now" ? "queued" : "scheduled",
      scheduled_for:
        mode === "now"
          ? new Date().toISOString()
          : new Date(scheduledFor).toISOString(),
      title_used: title.trim() || null,
      description_used: description.trim() || null,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="card-base p-4 flex gap-4">
      {/* Thumbnail */}
      <div className="w-28 shrink-0 aspect-[9/16] bg-bg border border-border overflow-hidden">
        {clip.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-body text-[9px] uppercase tracking-widest text-muted">
            no thumb
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="font-body text-[10px] uppercase tracking-widest text-muted">
          {clip.project?.streamer_name || clip.project?.name || "Unknown project"}
        </div>

        {/* Platform selector */}
        <div className="flex gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={!p.enabled}
              onClick={() => p.enabled && setPlatform(p.id)}
              className={[
                "px-2.5 py-1 rounded-sm font-body text-[10px] uppercase tracking-widest border transition",
                !p.enabled
                  ? "border-border text-muted/50 cursor-not-allowed"
                  : platform === p.id
                    ? "bg-accent border-accent text-bg"
                    : "border-border text-text hover:border-accent",
              ].join(" ")}
            >
              {p.label}
              {!p.enabled && " · soon"}
            </button>
          ))}
        </div>

        <div>
          <label className="label-base">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base font-head text-sm tracking-tightest"
            placeholder="Post title"
          />
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input-base resize-none text-xs leading-snug"
            placeholder="Post description"
          />
        </div>

        {/* Schedule + action */}
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("now")}
              className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-body text-[10px] uppercase tracking-widest border transition",
                mode === "now"
                  ? "bg-accent border-accent text-bg"
                  : "border-border text-text hover:border-accent",
              ].join(" ")}
            >
              <Zap size={11} strokeWidth={2.5} />
              Post now
            </button>
            <button
              type="button"
              onClick={() => setMode("schedule")}
              className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-body text-[10px] uppercase tracking-widest border transition",
                mode === "schedule"
                  ? "bg-accent border-accent text-bg"
                  : "border-border text-text hover:border-accent",
              ].join(" ")}
            >
              <Calendar size={11} strokeWidth={2.5} />
              Schedule
            </button>
          </div>
          {mode === "schedule" && (
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="input-base text-xs w-auto"
            />
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-accent disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} strokeWidth={2.5} />
            )}
            <span>
              {submitting
                ? "Working…"
                : mode === "now"
                  ? "Add to queue"
                  : "Schedule"}
            </span>
          </button>
        </div>
        {error && (
          <div className="font-body text-xs text-danger">{error}</div>
        )}
      </div>
    </div>
  );
}
