import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/setup-profiles
 *
 * Creates the `profiles` table and storage bucket via Supabase Management API.
 * Requires header: x-setup-secret: setup_wecollab_profiles_2024
 * 
 * This uses the Supabase Management API (not direct pg connection),
 * so it works without a database password.
 */
export async function POST(req: NextRequest) {
  // Simple secret guard
  const secret = req.headers.get('x-setup-secret');
  if (secret !== 'setup_wecollab_profiles_2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  // Extract project ref from URL: https://<ref>.supabase.co
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!refMatch) {
    return NextResponse.json({ error: 'Cannot parse project ref from URL' }, { status: 500 });
  }
  const projectRef = refMatch[1];

  const sql = `
-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  company text,
  role text,
  bio text,
  location text,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_authenticated'
  ) then
    create policy "profiles_select_authenticated" on public.profiles
      for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own" on public.profiles
      for insert to authenticated with check (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own" on public.profiles
      for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

-- Service role full access (bypass RLS for server-side operations)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_service_role_all'
  ) then
    create policy "profiles_service_role_all" on public.profiles
      for all to service_role using (true) with check (true);
  end if;
end $$;
`;

  try {
    // Use Supabase Management API to run SQL
    const mgmtRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!mgmtRes.ok) {
      const errText = await mgmtRes.text();
      console.error('[setup-profiles] Management API error:', errText);
      
      // Fallback: Try creating table via the REST API upsert trick
      // The profiles table might already exist, let's verify by trying to query it
      const verifyRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
          }
        }
      );
      
      if (verifyRes.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'Profiles table already exists and is accessible',
          mgmtApiError: errText
        });
      }

      return NextResponse.json({ 
        error: 'Migration failed', 
        details: errText,
        hint: 'Run the SQL manually in Supabase Dashboard > SQL Editor'
      }, { status: 500 });
    }

    // Also ensure avatars bucket exists
    const bucketRes = await fetch(
      `${supabaseUrl}/storage/v1/bucket`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 'avatars', name: 'avatars', public: true }),
      }
    );

    const bucketData = await bucketRes.json();
    const bucketOk = bucketRes.ok || bucketData?.error === 'Duplicate';

    return NextResponse.json({
      success: true,
      message: 'Profiles table created/verified successfully',
      bucket: bucketOk ? 'avatars bucket ready' : bucketData,
    });

  } catch (err: any) {
    console.error('[setup-profiles] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
