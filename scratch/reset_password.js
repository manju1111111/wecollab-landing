import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const hash = await bcrypt.hash('password123', 10);
  const { data, error } = await supabase
    .from('employees')
    .update({ password_hash: hash, status: 'active' })
    .eq('email', 'mmm@gmail.com')
    .select();
  
  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Successfully updated employee password:', data);
  }
}

run();
