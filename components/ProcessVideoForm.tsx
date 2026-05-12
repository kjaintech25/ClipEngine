"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function ProcessVideoForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error: err } = await supabase.from("jobs").insert({
      project_id: projectId,
      url: url.trim(),
      status: "pending",
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }
    setUrl("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=…"
        className="input-base flex-1"
        required
      />
      <button
        type="submit"
        className="btn-accent shrink-0 disabled:opacity-50"
        disabled={!url.trim() || submitting}
      >
        <Plus size={14} strokeWidth={2.5} />
        <span>{submitting ? "Queuing…" : "Queue"}</span>
      </button>
      {error && (
        <div className="absolute font-body text-xs text-danger mt-12">
          {error}
        </div>
      )}
    </form>
  );
}
