const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Testing public.brands reset columns...");
  const { data: bData, error: bError } = await supabase
    .from('brands')
    .select('id, reset_token, reset_token_expires_at')
    .limit(1);
  if (bError) {
    console.log("Brands columns missing or error:", bError.message);
  } else {
    console.log("Brands columns reset_token and reset_token_expires_at exist!");
  }

  console.log("Testing public.login_attempts table...");
  const { data: lData, error: lError } = await supabase
    .from('login_attempts')
    .select('*')
    .limit(1);
  if (lError) {
    console.log("login_attempts table missing or error:", lError.message);
  } else {
    console.log("login_attempts table exists!");
  }
}

test();
