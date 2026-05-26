import { createClient } from "@/lib/supabase/server";
import { CreatorForm } from "../../creator-form";
import { notFound } from "next/navigation";

export default async function EditCreatorPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: creator, error } = await supabase
    .from("creators")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !creator) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold leading-6 text-slate-900">Edit Creator</h2>
        <p className="mt-1 text-sm text-slate-500">
          Updating this creator will instantly sync changes to the Algolia search engine.
        </p>
      </div>

      <CreatorForm initialData={creator} id={creator.id} />
    </div>
  );
}
