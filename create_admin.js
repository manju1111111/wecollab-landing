const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('Creating admin user...');
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@wecollab.in',
    password: 'wecollab@24',
    email_confirm: true // Force confirm the email so they can log in immediately
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('Successfully created user:', data.user.email);
  }
}

createAdminUser();
