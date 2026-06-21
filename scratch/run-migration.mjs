// Migration runner using Supabase JS client (REST API based)
// No direct pg connection needed — uses service role key
// Run: node scratch/run-migration.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Extract project ref
const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = refMatch?.[1];
if (!projectRef) {
  console.error('Cannot parse project ref from URL:', supabaseUrl);
  process.exit(1);
}

console.log('Project ref:', projectRef);
console.log('Supabase URL:', supabaseUrl);

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

-- Policies (safe to run multiple times)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_authenticated'
  ) then
    execute 'create policy profiles_select_authenticated on public.profiles for select to authenticated using (true)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_insert_own'
  ) then
    execute 'create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = id)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    execute 'create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_service_role_all'
  ) then
    execute 'create policy profiles_service_role_all on public.profiles for all to service_role using (true) with check (true)';
  end if;
end $$;
`;

async function runMigration() {
  console.log('\n--- Step 1: Running profiles table migration ---');
  
  // Try Supabase Management API
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
    console.log('Management API response:', mgmtRes.status, errText);
    
    console.log('\n--- Trying to verify if table already exists ---');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (!error) {
      console.log('✓ profiles table already exists!');
    } else {
      console.error('Table does not exist. Error:', error.message);
      console.log('\nManual SQL to run in Supabase Dashboard > SQL Editor:');
      console.log(sql);
    }
  } else {
    const result = await mgmtRes.json();
    console.log('✓ Migration SQL executed:', result);
  }

  console.log('\n--- Step 2: Ensuring avatars storage bucket ---');
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
  if (bucketRes.ok) {
    console.log('✓ Avatars bucket created');
  } else if (bucketData?.error?.includes('already exists') || bucketData?.message?.includes('already exists')) {
    console.log('✓ Avatars bucket already exists');
  } else {
    console.log('Bucket response:', bucketRes.status, bucketData);
  }

  console.log('\n--- Step 3: Verifying profiles table access ---');
  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('✗ profiles table not accessible:', testError.message);
    console.log('\nIMPORTANT: Please run the following SQL manually in Supabase Dashboard > SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('\n' + sql);
  } else {
    console.log('✓ profiles table is accessible. Rows found:', testData?.length ?? 0);
    console.log('\n✅ Migration complete! The admin profile persistence is ready.');
  }
}

runMigration().catch(console.error);
