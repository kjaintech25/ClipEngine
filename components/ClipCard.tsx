"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/url";
import type { Clip } from "@/lib/types";

const DEBOUNCE_MS = 600;

export function ClipCard({ clip }: { clip: Clip }) {
  const [title, setTitle] = useState(clip.title ?? "");
  const [description, setDescription] = useState(clip.description ?? "");
  const [hashtags, setHashtags] = useState(clip.hashtags ?? "");
  const [approved, setApproved] = useState(clip.approved);
  const [saving, setSaving] = useState<null | "saving" | "saved">(null);

  useEffect(() => {
    setTitle(clip.title ?? "");
    setDescription(clip.description ?? "");
    setHashtags(clip.hashtags ?? "");
    setApproved(clip.approved);
  }, [clip.id, clip.title, clip.description, clip.hashtags, clip.approved]);

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (
      title === (clip.title ?? "") &&
      description === (clip.description ?? "") &&
      hashtags === (clip.hashtags ?? "")
    ) {
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSaving("saving");
      const supabase = supabaseBrowser();
      await supabase
        .from("clips")
        .update({ title, description, hashtags })
        .eq("id", clip.id);
      setSaving("saved");
      window.setTimeout(() => setSaving(null), 1200);
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [title, description, hashtags, clip.id, clip.title, clip.description, clip.hashtags]);

  async function toggleApprove() {
    const next = !approved;
    setApproved(next);
    const supabase = supabaseBrowser();
    await supabase.from("clips").update({ approved: next }).eq("id", clip.id);
  }

  const duration =
    clip.duration_secs ??
    (clip.start_time != null && clip.end_time != null
      ? clip.end_time - clip.start_time
      : null);

  return (
    <div
      className={[
        "card-base flex flex-col overflow-hidden transition",
        approved ? "border-accent" : "",
      ].join(" ")}
    >
      {/* Video */}
      <div className="aspect-video bg-bg border-b border-border relative">
        {clip.video_url ? (
          <video
            src={clip.video_url}
            poster={clip.thumbnail_url ?? undefined}
            controls
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-body text-xs text-muted uppercase tracking-widest">
            No video uploaded
          </div>
        )}
        {duration != null && (
          <div className="absolute top-2 left-2 bg-card/90 backdrop-blur border border-border px-2 py-0.5 font-body text-[10px] uppercase tracking-widest text-muted">
            {formatDuration(duration)}
          </div>
        )}
        {clip.start_time != null && (
          <div className="absolute top-2 right-2 bg-card/90 backdrop-blur border border-border px-2 py-0.5 font-body text-[10px] uppercase tracking-widest text-muted tabular-nums">
            t+{formatDuration(clip.start_time)}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label-base mb-0">Title</label>
            <SaveIndicator state={saving} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base font-head text-sm tracking-tightest"
            placeholder="Hook headline (≤60 chars)"
          />
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input-base resize-none text-xs leading-snug"
            placeholder="SEO description"
          />
        </div>

        <div>
          <label className="label-base">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="input-base text-xs"
            placeholder="#viral, #clip, …"
          />
        </div>

        {clip.viral_reason && (
          <div className="border-l-2 border-accent pl-3 mt-1">
            <div className="label-base">Why viral · Claude</div>
            <div className="font-body text-xs italic text-muted leading-snug">
              {clip.viral_reason}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-border p-3 flex items-center gap-2">
        <button
          onClick={toggleApprove}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 font-head uppercase tracking-wider text-xs rounded-sm border transition",
            approved
              ? "bg-accent border-accent text-bg"
              : "border-border text-text hover:border-accent hover:text-accent",
          ].join(" ")}
        >
          <Check size={14} strokeWidth={2.5} />
          {approved ? "Approved" : "Approve"}
        </button>
        {clip.video_url && (
          <a
            href={clip.video_url}
            download
            target="_blank"
            rel="noreferrer"
            className="btn-ghost shrink-0"
            aria-label="Download clip"
          >
            <Download size={14} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: null | "saving" | "saved" }) {
  if (!state) return null;
  return (
    <span
      className={[
        "font-body text-[10px] uppercase tracking-widest",
        state === "saving" ? "text-muted" : "text-accent",
      ].join(" ")}
    >
      {state === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}
