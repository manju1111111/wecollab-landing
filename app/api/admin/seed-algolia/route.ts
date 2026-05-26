import { NextResponse } from "next/server";
import { algoliasearch } from "algoliasearch";
import { MOCK_CREATORS } from "@/data/mock-creators";

export async function GET(request: Request) {
  try {
    const adminClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.ALGOLIA_ADMIN_KEY!
    );

    // Format the creators for Algolia (requires objectID)
    const objectsToSave = MOCK_CREATORS.map((creator) => ({
      ...creator,
      objectID: creator.id,
    }));

    await adminClient.saveObjects({
      indexName: "creators",
      objects: objectsToSave,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${objectsToSave.length} creators into Algolia!` 
    });
  } catch (error) {
    console.error("[ALGOLIA_SEED_ERROR]", error);
    return new NextResponse("Internal Seed Error", { status: 500 });
  }
}
