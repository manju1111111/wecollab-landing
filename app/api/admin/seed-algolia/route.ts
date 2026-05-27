import { NextResponse } from "next/server";
import { algoliasearch } from "algoliasearch";
import { MOCK_CREATORS } from "@/data/mock-creators";

export async function GET(request: Request) {
  try {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    
    if (!appId || !adminKey) {
      return NextResponse.json({
        success: false,
        error: "Algolia environment variables (NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY) are missing."
      }, { status: 400 });
    }

    const adminClient = algoliasearch(appId, adminKey);

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
