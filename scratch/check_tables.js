const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const rpcs = [
    { name: 'exec_sql', args: { sql: 'select 1;' } },
    { name: 'run_sql', args: { sql: 'select 1;' } },
    { name: 'execute_sql', args: { sql: 'select 1;' } },
    { name: 'exec', args: { query: 'select 1;' } }
  ];

  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc.name, rpc.args);
      if (error) {
        console.log(`RPC "${rpc.name}": Error -> ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`RPC "${rpc.name}": Success! Result:`, data);
      }
    } catch (e) {
      console.log(`RPC "${rpc.name}": Exception -> ${e.message}`);
    }
  }
}

check();
