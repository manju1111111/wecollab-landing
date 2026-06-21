const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Service Key Length:", supabaseServiceKey ? supabaseServiceKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Attempting to insert a temporary employee...");
  const tempEmail = `test-rls-${Date.now()}@wecollab.com`;
  const { data, error } = await supabase
    .from('employees')
    .insert({
      full_name: 'Test RLS Employee',
      email: tempEmail,
      role: 'Employee',
      status: 'invited',
      invitation_token: 'test-token',
      invited_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Error inserting employee:", error);
  } else {
    console.log("Successfully inserted employee:", data);
    
    // Clean up
    console.log("Cleaning up employee...");
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', data[0].id);
      
    if (deleteError) {
      console.error("Error cleaning up employee:", deleteError);
    } else {
      console.log("Successfully cleaned up!");
    }
  }
}

test();
