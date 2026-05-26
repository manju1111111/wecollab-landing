import { NextResponse } from "next/server";
import { searchEngine, SearchFilters } from "@/lib/search-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body;

    // Securely query the Search Engine Backend
    const results = await searchEngine.search(filters);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API_DISCOVER_ERROR]", error);
    return new NextResponse("Internal Search Engine Error", { status: 500 });
  }
}
