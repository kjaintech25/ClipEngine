import { supabaseServer } from "@/lib/supabase/server";
import { ProjectsHome } from "@/components/ProjectsHome";
import type { ProjectWithClipCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "*, clips(count), jobs(count), creator:creators(id, name, platform, channel_url)",
    )
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as (ProjectWithClipCount & {
    jobs: { count: number }[];
  })[];

  return <ProjectsHome projects={projects} initialError={error?.message ?? null} />;
}
