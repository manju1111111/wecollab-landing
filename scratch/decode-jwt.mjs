// Find the database URL from Supabase
// The service role key contains the project ref in its JWT payload
// Transaction pooler: postgresql://postgres.[ref]:[password]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres

import { config } from 'dotenv';
config({ path: '.env.local' });

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Decode JWT to get project ref
const parts = serviceKey.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
console.log('JWT payload:', JSON.stringify(payload, null, 2));
