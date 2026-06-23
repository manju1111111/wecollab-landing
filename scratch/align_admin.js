const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const adminId = 'b648f470-60b9-42a7-ad3d-10497c13625f';
  const adminEmail = 'admin@wecollab.in';
  const adminPassword = 'wecollab@2026';

  console.log(`1. Resetting auth password for ${adminEmail} in Supabase Auth...`);
  const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(adminId, {
    password: adminPassword,
    user_metadata: { role: 'Admin' }
  });

  if (authError) {
    console.error("Auth password reset failed:", authError.message);
    return;
  }
  console.log("Auth password successfully reset!");

  console.log("2. Updating profile role to 'Admin' in public.profiles...");
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'Admin' })
    .eq('id', adminId);

  if (profileError) {
    console.error("Profiles update failed:", profileError.message);
  } else {
    console.log("Profile role updated successfully!");
  }

  console.log("3. Syncing admin user into public.employees table...");
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  // Check if already exists in employees table
  const { data: existingEmp } = await supabase
    .from('employees')
    .select('id')
    .eq('email', adminEmail)
    .single();

  if (existingEmp) {
    const { error: empUpdateError } = await supabase
      .from('employees')
      .update({
        id: adminId,
        full_name: 'Manju (Super Admin)',
        role: 'Admin',
        status: 'active',
        password_hash: passwordHash
      })
      .eq('email', adminEmail);
      
    if (empUpdateError) {
      console.error("Employees table update failed:", empUpdateError.message);
    } else {
      console.log("Employees table record updated successfully!");
    }
  } else {
    const { error: empInsertError } = await supabase
      .from('employees')
      .insert({
        id: adminId,
        full_name: 'Manju (Super Admin)',
        email: adminEmail,
        role: 'Admin',
        status: 'active',
        password_hash: passwordHash
      });
      
    if (empInsertError) {
      console.error("Employees table insert failed:", empInsertError.message);
    } else {
      console.log("Employees table record inserted successfully!");
    }
  }
  
  console.log("\nSetup complete! Super Admin credentials are set.");
}

run();
