const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "TRIGGER_API_KEY",
  "TRIGGER_API_URL",
  "RESEND_API_KEY",
  "GEMINI_API_KEY",
  "APIFY_TOKEN",
  "YOUTUBE_API_KEY",
  "RAPIDAPI_KEY",
];

let hasValidated = false;

export function validateEnv() {
  if (hasValidated) return;

  // Skip throwing hard errors during compilation phase on CI/build systems
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test";

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const errorMsg =
      `\n🚨 CRITICAL CONFIGURATION ERROR: Missing required environment variables:\n` +
      missing.map((key) => `   - ${key}`).join("\n") +
      `\n\nPlease configure these in your .env.local file or Vercel Dashboard.\n`;

    console.error(errorMsg);

    if (!isBuildPhase && typeof window === "undefined") {
      throw new Error(errorMsg);
    }
  }

  hasValidated = true;
}
