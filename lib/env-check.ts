const CRITICAL_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const OPTIONAL_INTEGRATION_VARS = [
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

  // 1. Validate Critical Variables (Hard crash if missing at runtime)
  const missingCritical = CRITICAL_ENV_VARS.filter((key) => !process.env[key]);
  if (missingCritical.length > 0) {
    const errorMsg =
      `\n🚨 CRITICAL CONFIGURATION ERROR: Missing required environment variables:\n` +
      missingCritical.map((key) => `   - ${key}`).join("\n") +
      `\n\nPlease configure these in your .env.local file or Vercel Dashboard.\n`;

    console.error(errorMsg);

    if (!isBuildPhase && typeof window === "undefined") {
      throw new Error(errorMsg);
    }
  }

  // 2. Validate Optional Integrations (Log warning in server logs, do not crash)
  const missingIntegrations = OPTIONAL_INTEGRATION_VARS.filter((key) => !process.env[key]);
  if (missingIntegrations.length > 0) {
    const warningMsg =
      `\n⚠️ INTEGRATION WARNING: The following optional environment variables are missing:\n` +
      missingIntegrations.map((key) => `   - ${key}`).join("\n") +
      `\nSome third-party features (email, background jobs, scraping, AI) may be disabled.\n`;

    console.warn(warningMsg);
  }

  hasValidated = true;
}
