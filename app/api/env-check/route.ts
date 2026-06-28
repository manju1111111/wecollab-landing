import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vars = [
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

  const status = vars.reduce((acc, key) => {
    const val = process.env[key];
    acc[key] = {
      present: !!val,
      length: val ? val.length : 0,
      prefix: val ? val.slice(0, 5) : "",
    };
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json(status);
}
