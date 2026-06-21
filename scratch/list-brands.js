const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBrands() {
  console.log("Listing brands...");
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, email, status');
  if (error) {
    console.error("Error fetching brands:", error.message);
  } else {
    console.log("Existing Brands:");
    console.log(brands);
  }
}

listBrands();
