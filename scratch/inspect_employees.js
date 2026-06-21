import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data, error } = await supabase.from('employees').select('id, full_name, email, role, status');
  if (error) {
    console.error('Error fetching employees:', error);
  } else {
    console.log('Employees:', data);
  }
}

run();
