/**
 * lib/avatar-utils.ts
 * Shared utilities for safe creator avatar rendering across the app.
 */

/**
 * Sanitizes a raw image source string before rendering.
 * - Forces HTTPS (prevents mixed content warnings)
 * - Rejects data: URIs (base64 — too large, causes layout shift)
 * - Returns empty string for anything that doesn't look like a valid URL
 */
export function sanitizeImageSrc(src: string | null | undefined): string {
  if (!src) return "";

  const s = src.trim();

  // Reject base64 blobs — they are too large for img tags in lists and
  // cause significant memory pressure on mobile.
  if (s.startsWith("data:")) return "";

  // Force HTTPS to prevent mixed-content browser warnings.
  if (s.startsWith("http://")) return s.replace("http://", "https://");

  // Accept valid HTTPS URLs.
  if (s.startsWith("https://")) return s;

  // Reject anything else (relative paths without proper context, etc.)
  return "";
}

/**
 * Derives initials from a display name.
 * e.g. "Virat Kohli" → "VK", "MJU🔱" → "M"
 */
export function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

/**
 * Returns the best available image URL for a creator object,
 * checking both snake_case (Supabase/Algolia) and camelCase (mock data) fields.
 */
export function resolveCreatorImage(creator: any): string {
  return sanitizeImageSrc(
    creator?.profile_image_url ||
    creator?.profile_image ||
    creator?.avatar_url ||
    creator?.avatar ||
    ""
  );
}
