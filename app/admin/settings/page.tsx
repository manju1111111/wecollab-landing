import { CategorizationLogsClient } from "@/components/admin/settings/categorization-logs-client";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <CategorizationLogsClient />
    </div>
  );
}
