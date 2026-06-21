import { createAdminClient } from "@/lib/supabase/server";
import { getNewsletters, getNewsletterSubscribers } from "@/lib/supabase/fallback-db";
import { AdminNewsletterClient } from "@/components/admin/newsletter/admin-newsletter-client";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const supabase = await createAdminClient();

  // Fetch all newsletters (drafts & published) and subscribers lists
  const newsletters = await getNewsletters(supabase, true);
  const subscribers = await getNewsletterSubscribers(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Newsletter Portal</h1>
        <p className="text-slate-500 mt-1">Compose, publish, and manage daily newsletter briefings and subscribers.</p>
      </div>

      <AdminNewsletterClient initialNewsletters={newsletters} initialSubscribers={subscribers} />
    </div>
  );
}
