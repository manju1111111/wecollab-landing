const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Anon Key Length:", supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log("Service Key Length:", supabaseServiceKey ? supabaseServiceKey.length : 0);

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const tempEmail = `test-policy-${Date.now()}@wecollab.com`;
  
  console.log("\n1. Testing INSERT with Admin Client (Service Role)...");
  const { data: adminData, error: adminError } = await adminClient
    .from('employees')
    .insert({
      full_name: 'Test Admin Client',
      email: tempEmail,
      role: 'Employee',
      status: 'invited',
      invitation_token: 'test-token-admin',
      invited_at: new Date().toISOString()
    })
    .select();

  if (adminError) {
    console.error("❌ Admin insert failed:", adminError.message);
  } else {
    console.log("✅ Admin insert succeeded! ID:", adminData[0].id);
    
    // Clean up
    await adminClient.from('employees').delete().eq('id', adminData[0].id);
  }

  console.log("\n2. Testing INSERT with Anon Client...");
  const { data: anonData, error: anonError } = await anonClient
    .from('employees')
    .insert({
      full_name: 'Test Anon Client',
      email: tempEmail + '-anon',
      role: 'Employee',
      status: 'invited',
      invitation_token: 'test-token-anon',
      invited_at: new Date().toISOString()
    })
    .select();

  if (anonError) {
    console.error("❌ Anon insert failed:", anonError.message);
  } else {
    console.log("✅ Anon insert succeeded! ID:", anonData[0].id);
    
    // Clean up
    await adminClient.from('employees').delete().eq('id', anonData[0].id);
  }
}

test();
