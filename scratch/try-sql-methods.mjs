// Try to run SQL via Supabase REST API using various methods
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function tryMethod(name, fetchCall) {
  try {
    const res = await fetchCall();
    const text = await res.text();
    console.log(`[${name}] Status: ${res.status}`);
    console.log(`[${name}] Response: ${text.substring(0, 500)}`);
    return res.ok;
  } catch (e) {
    console.log(`[${name}] Error: ${e.message}`);
    return false;
  }
}

// The actual SQL we need to run
const createTableSQL = `
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
alter table public.profiles enable row level security;
`;

const headers = {
  'Authorization': `Bearer ${serviceKey}`,
  'apikey': serviceKey,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// Method 1: Try pg_query RPC
await tryMethod('rpc/pg_query', () =>
  fetch(`${supabaseUrl}/rest/v1/rpc/pg_query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: createTableSQL }),
  })
);

// Method 2: Try exec_sql RPC
await tryMethod('rpc/exec_sql', () =>
  fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql: createTableSQL }),
  })
);

// Method 3: Try GraphQL
await tryMethod('graphql', () =>
  fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation { profiles: executeRaw(query: "SELECT 1") { count } }`
    }),
  })
);

// Method 4: Check if profiles table exists via metadata
await tryMethod('check-profiles-exist', () =>
  fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=0`, {
    headers,
  })
);

console.log('\nDone.');
