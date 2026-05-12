"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { parseStreamerUrl } from "@/lib/url";

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const parsed = parseStreamerUrl(url);
    const supabase = supabaseBrowser();

    const projectName =
      name.trim() ||
      (parsed.streamer_name
        ? `${parsed.streamer_name} — ${new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
        : "Untitled project");

    // Find-or-create the creator tag so multiple projects for the same
    // streamer are linked under one canonical entity.
    let creatorId: string | null = null;
    if (parsed.channel_url && parsed.streamer_name) {
      const { data: creator, error: creatorErr } = await supabase
        .from("creators")
        .upsert(
          {
            name: parsed.streamer_name,
            platform: parsed.platform,
            channel_url: parsed.channel_url,
          },
          { onConflict: "channel_url" },
        )
        .select("id")
        .single();
      if (creatorErr) {
        setError(`Failed to tag creator: ${creatorErr.message}`);
        setSubmitting(false);
        return;
      }
      creatorId = creator?.id ?? null;
    }

    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        name: projectName,
        streamer_name: parsed.streamer_name,
        platform: parsed.platform,
        channel_url: parsed.channel_url,
        creator_id: creatorId,
        status: "active",
      })
      .select()
      .single();

    if (projErr || !project) {
      setError(projErr?.message ?? "Failed to create project.");
      setSubmitting(false);
      return;
    }

    const { error: jobErr } = await supabase.from("jobs").insert({
      project_id: project.id,
      url: url.trim(),
      status: "pending",
    });

    if (jobErr) {
      setError(`Project created, but failed to enqueue job: ${jobErr.message}`);
      setSubmitting(false);
      return;
    }

    router.refresh();
    router.push(`/projects/${project.id}`);
    onClose();
  }

  const parsed = url ? parseStreamerUrl(url) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/85 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="card-base w-full max-w-xl border-accent/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-body text-[10px] uppercase tracking-widest text-muted">
              New
            </div>
            <h2 className="font-head font-bold text-xl tracking-tightest leading-none mt-1">
              PROCESS A VIDEO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="label-base">Video or channel URL *</label>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or https://twitch.tv/…"
              className="input-base"
              required
            />
            {parsed && (parsed.streamer_name || parsed.platform !== "unknown") && (
              <div className="mt-2 font-body text-[10px] uppercase tracking-widest text-muted">
                Detected:{" "}
                <span className="text-accent">
                  {parsed.streamer_name ?? "—"}
                </span>{" "}
                · {parsed.platform}
              </div>
            )}
          </div>

          <div>
            <label className="label-base">Project name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                parsed?.streamer_name
                  ? `${parsed.streamer_name} — ${new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                  : "Auto-generated from URL"
              }
              className="input-base"
            />
          </div>

          {error && (
            <div className="border border-danger/40 bg-danger/10 px-3 py-2 text-danger font-body text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="font-body text-[10px] uppercase tracking-widest text-muted">
              Creates a project + queues a job
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-accent disabled:opacity-50"
                disabled={!url.trim() || submitting}
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
