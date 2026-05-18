import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { CreatorDashboard } from "@/components/CreatorDashboard";
import type { Creator, ProjectWithCounts } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const creatorRes = await supabase
    .from("creators")
    .select("*")
    .eq("id", params.id)
    .single();

  if (creatorRes.error || !creatorRes.data) {
    return notFound();
  }
  const creator = creatorRes.data as Creator;

  const projectsRes = await supabase
    .from("projects")
    .select("*, clips(count), jobs(count)")
    .eq("creator_id", params.id)
    .order("created_at", { ascending: false });
  const projects = (projectsRes.data ?? []) as ProjectWithCounts[];

  let approvedCount = 0;
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length > 0) {
    const approvedRes = await supabase
      .from("clips")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds)
      .eq("approved", true);
    approvedCount = approvedRes.count ?? 0;
  }

  return (
    <CreatorDashboard
      creator={creator}
      projects={projects}
      approvedCount={approvedCount}
    />
  );
}
