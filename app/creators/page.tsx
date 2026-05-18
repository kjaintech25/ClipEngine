import { supabaseServer } from "@/lib/supabase/server";
import { CreatorsIndex } from "@/components/CreatorsIndex";
import type { CreatorWithProjects } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("creators")
    .select("*, projects(id, clips(count))")
    .order("name", { ascending: true });

  const creators = (data ?? []) as CreatorWithProjects[];

  return (
    <CreatorsIndex creators={creators} initialError={error?.message ?? null} />
  );
}
