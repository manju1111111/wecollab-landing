import { CreatorForm } from "../creator-form";

export default function NewCreatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold leading-6 text-slate-900">Add New Creator</h2>
        <p className="mt-1 text-sm text-slate-500">
          This creator will be securely saved to Supabase and instantly synced to the Algolia search engine.
        </p>
      </div>

      <CreatorForm />
    </div>
  );
}
