const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching employee:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Employee columns in database:");
    console.log(Object.keys(data[0]));
  } else {
    console.log("No employees found in the database to inspect.");
  }
}

inspect();
