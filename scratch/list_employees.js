const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function list() {
  const { data, error } = await supabase
    .from('employees')
    .select('email, full_name, role, status');

  if (error) {
    console.error("Error fetching employees:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Employees registered in your database:");
    console.table(data);
  } else {
    console.log("No employees found in the database.");
  }
}

list();
