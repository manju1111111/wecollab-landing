import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy — tunnels remote images through the server to avoid CORS issues
 * with Instagram CDN, YouTube thumbnails, etc.
 * Usage: /api/proxy-image?url=https://...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Only allow trusted domains
  const allowed = [
    "cdninstagram.com",
    "fbcdn.net",
    "instagram.com",
    "googleapis.com",
    "ytimg.com",
    "googleusercontent.com",
    "i.ytimg.com",
  ];
  const isAllowed = allowed.some((domain) => imageUrl.includes(domain));
  if (!isAllowed) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[IMAGE_PROXY_ERROR]", err);
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
