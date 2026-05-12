import { BarChart3 } from "lucide-react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export default function Page() {
  return (
    <PlaceholderScreen
      title="ANALYTICS"
      version="V5 · Revenue dashboard"
      Icon={BarChart3}
      description="Total views, estimated revenue this month, best performing clip. Breakdown by platform and by streamer. Auto-refresh daily, manual refresh on demand."
    />
  );
}
