import { NextResponse } from "next/server";
import { searchEngine, SearchFilters } from "@/lib/search-client";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role
function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Sanitizes a profile image value before sending to the frontend:
 *  - Returns empty string for base64 data URIs (too large, causes memory pressure)
 *  - Forces HTTPS (no mixed-content warnings)
 *  - Returns empty string for anything else that isn't a valid URL
 */
function sanitizeImageForResponse(img: string | null | undefined): string {
  if (!img) return "";
  const s = img.trim();
  if (s.startsWith("data:")) return "";            // strip base64 blobs
  if (s.startsWith("http://")) return s.replace("http://", "https://"); // force HTTPS
  if (s.startsWith("https://")) return s;
  return "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body;

    // 1. Search Algolia
    const results = await searchEngine.search(filters);

    // 2. Sanitize all images and strip sensitive fields from Algolia hits
    //    (some legacy records may have slipped through with http:// or bad values)
    results.hits = results.hits.map((hit: any) => {
      const sanitized = {
        ...hit,
        profile_image: sanitizeImageForResponse(hit.profile_image),
      };

      // Remove any sensitive contact fields from public payloads
      delete sanitized.email;
      delete sanitized.contact_email;
      delete sanitized.contact;
      delete sanitized.phone;

      return sanitized;
    });

    // 3. Enrich hits that have no image from Supabase (handles old creators
    //    whose images were stripped during the base64→CDN migration).
    //    Uses a hard 3-second timeout so a slow DB never blocks the response.
    const emptyImageHits = results.hits.filter((h: any) => !h.profile_image);

    if (emptyImageHits.length > 0) {
      const ids = emptyImageHits.map((h: any) => h.id || h.objectID).filter(Boolean);

      try {
        const supabase = getSupabaseServer();

        // ⏱ 3-second timeout: if Supabase is slow, we degrade gracefully (no images
        // for those records this request, but the UI still renders with initials).
        const enrichPromise = supabase
          .from("creators")
          .select("id, profile_image")
          .in("id", ids);

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );

        const settled = await Promise.race([enrichPromise, timeoutPromise]);

        if (settled && "data" in settled && settled.data && settled.data.length > 0) {
          const imageMap = new Map(
            settled.data.map((r: any) => [r.id, sanitizeImageForResponse(r.profile_image)])
          );

          results.hits = results.hits.map((hit: any) => {
            const hitId = hit.id || hit.objectID;
            if (!hit.profile_image && imageMap.has(hitId)) {
              return { ...hit, profile_image: imageMap.get(hitId) };
            }
            return hit;
          });
        } else if (settled === null) {
          console.warn("[DISCOVER_ENRICH_TIMEOUT] Supabase image enrichment timed out after 3s — returning without images.");
        }
      } catch (enrichError) {
        // Non-fatal: degrade gracefully — UI will show initials fallback
        console.warn("[DISCOVER_ENRICH_WARN] Image enrichment failed:", enrichError);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API_DISCOVER_ERROR]", error);
    return new NextResponse("Internal Search Engine Error", { status: 500 });
  }
}
