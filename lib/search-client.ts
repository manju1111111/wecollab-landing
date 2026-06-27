import { Creator } from "@/data/mock-creators";
import { algoliasearch } from "algoliasearch";

export type SearchFilters = {
  query?: string;
  platform?: string;
  location?: string;
  followers?: string;
  subCategories?: string[];
  page?: number;
  limit?: number;
  sortBy?: "followers" | "score" | "er";
  sortDir?: "asc" | "desc";
};

export type SearchResult = {
  hits: Creator[];
  totalHits: number;
  page: number;
  totalPages: number;
};

let _client: ReturnType<typeof algoliasearch> | null = null;

function getClient() {
  if (!_client) {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
    
    if (!appId || !searchKey) {
      throw new Error("Algolia keys (NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY) are missing in environment variables.");
    }
    
    _client = algoliasearch(appId, searchKey);
  }
  return _client;
}

const INDEX_NAME = "creators";

export const searchEngine = {
  search: async (filters: SearchFilters): Promise<SearchResult> => {
    const page = filters.page ? filters.page - 1 : 0;
    const hitsPerPage = filters.limit || 20;

    // Build Facet Filters
    // GOLDEN RULE: Strict Backend Filtering for Discovery Page
    const facetFilters: string[] = [
      "creator_status:active",
      "visibility:public",
      "profile_completed:true",
      "verification_passed:true",
      "is_deleted:false"
    ];

    if (filters.platform && filters.platform !== "All Platforms") {
      facetFilters.push(`platforms.name:${filters.platform}`);
    }

    if (filters.location && filters.location !== "All") {
      facetFilters.push(`location:${filters.location}`);
    }

    if (filters.subCategories && filters.subCategories.length > 0) {
      // Filter by selected subcategories (OR relation for multiple selections)
      const subCatFilters = filters.subCategories.map(sub => `categories:${sub}`);
      facetFilters.push(subCatFilters as any);
    }

    // Build Numeric Filters
    const numericFilters: string[] = [];

    if (filters.followers && filters.followers !== "all") {
      if (filters.followers === "10k - 50k") numericFilters.push("totalFollowers >= 10000", "totalFollowers <= 50000");
      if (filters.followers === "50k - 100k") numericFilters.push("totalFollowers > 50000", "totalFollowers <= 100000");
      if (filters.followers === "100k - 500k") numericFilters.push("totalFollowers > 100000", "totalFollowers <= 500000");
      if (filters.followers === "500k+") numericFilters.push("totalFollowers > 500000");
    }

    // Algolia v5 structure
    const client = getClient();
    const response = await client.searchSingleIndex({
      indexName: INDEX_NAME,
      searchParams: {
        query: filters.query || "",
        facetFilters,
        numericFilters,
        page,
        hitsPerPage,
      },
    });

    // In a real production app, we would configure Algolia replica indices for sorting
    // (e.g. `creators_followers_desc`). For now, if sorting is requested, we can sort 
    // the hits we get back, or simply rely on Algolia's default ranking (which is usually best).
    let hits = response.hits as unknown as Creator[];

    if (filters.sortBy) {
      hits.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (filters.sortBy === "followers") {
          valA = a.totalFollowers;
          valB = b.totalFollowers;
        } else if (filters.sortBy === "score") {
          valA = a.score;
          valB = b.score;
        } else if (filters.sortBy === "er") {
          valA = a.engagementRate;
          valB = b.engagementRate;
        }
        return filters.sortDir === "asc" ? valA - valB : valB - valA;
      });
    }

    return {
      hits,
      totalHits: response.nbHits || 0,
      page: page + 1,
      totalPages: response.nbPages || 0,
    };
  },

  updateObject: async (id: string, updates: Partial<Creator>): Promise<boolean> => {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    if (!appId || !adminKey) {
      throw new Error("Algolia admin keys (NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY) are missing in environment variables.");
    }
    
    // Requires Admin API Key
    const adminClient = algoliasearch(appId, adminKey);

    await adminClient.partialUpdateObject({
      indexName: INDEX_NAME,
      objectID: id,
      attributesToUpdate: updates as any,
    });
    
    return true;
  },

  configureIndexSettings: async (): Promise<void> => {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    if (!appId || !adminKey) {
      throw new Error("Algolia admin keys (NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY) are missing in environment variables.");
    }
    
    const adminClient = algoliasearch(appId, adminKey);
    await adminClient.setSettings({
      indexName: INDEX_NAME,
      indexSettings: {
        attributesForFaceting: [
          "creator_status",
          "visibility",
          "profile_completed",
          "verification_passed",
          "is_deleted",
          "platforms.name",
          "location",
          "categories",
          "tags"
        ],
        searchableAttributes: [
          "name",
          "username",
          "bio",
          "category",
          "location"
        ]
      }
    });
  }
};
