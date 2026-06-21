const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reset() {
  const hash = await bcrypt.hash('wecollab@2026', 10);
  const { data, error } = await supabase
    .from('brands')
    .update({ password_hash: hash })
    .eq('email', 'nike@wecollab.in');

  if (error) {
    console.error("Error updating password:", error.message);
  } else {
    console.log("Successfully reset password for nike@wecollab.in to 'wecollab@2026'");
  }
}

reset();
