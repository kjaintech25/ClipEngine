import { supabaseServer } from "@/lib/supabase/server";
import { PostManager } from "@/components/PostManager";
import type { ApprovedClip, PostWithClip } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = supabaseServer();

  const [clipsRes, postsRes] = await Promise.all([
    supabase
      .from("clips")
      .select(
        "id, title, description, hashtags, thumbnail_url, video_url, duration_secs, project:projects(id, name, streamer_name)",
      )
      .eq("approved", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select(
        "*, clip:clips(id, title, thumbnail_url, video_url, project:projects(id, name, streamer_name))",
      )
      .order("created_at", { ascending: false }),
  ]);

  const approvedClips = (clipsRes.data ?? []) as unknown as ApprovedClip[];
  const posts = (postsRes.data ?? []) as unknown as PostWithClip[];

  // Queue = approved clips that don't yet have any posts row.
  const postedClipIds = new Set(posts.map((p) => p.clip_id));
  const queue = approvedClips.filter((c) => !postedClipIds.has(c.id));

  return <PostManager initialQueue={queue} initialPosts={posts} />;
}
