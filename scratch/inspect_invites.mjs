// Inspect employees table schema and check a recent invite
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// 1. Get the most recently invited employees
const { data: invitedEmployees, error: invErr } = await supabase
  .from('employees')
  .select('id, full_name, email, status, invitation_token, invitation_expires_at, invited_at')
  .eq('status', 'invited')
  .order('invited_at', { ascending: false })
  .limit(5);

console.log('\n=== Recently Invited Employees ===');
if (invErr) {
  console.error('Error:', invErr.message);
} else {
  invitedEmployees?.forEach(emp => {
    const expiresAt = emp.invitation_expires_at ? new Date(emp.invitation_expires_at) : null;
    const now = new Date();
    const isExpired = expiresAt ? expiresAt < now : false;
    const tokenPreview = emp.invitation_token ? emp.invitation_token.substring(0, 8) + '...' : 'NULL';
    
    console.log(`\n  Name: ${emp.full_name}`);
    console.log(`  Email: ${emp.email}`);
    console.log(`  Token: ${tokenPreview}`);
    console.log(`  Invited At: ${emp.invited_at}`);
    console.log(`  Expires At: ${emp.invitation_expires_at}`);
    console.log(`  Is Expired: ${isExpired}`);
    console.log(`  Has Token: ${!!emp.invitation_token}`);
  });
}

// 2. Also check all employees to understand current state
const { data: allEmp, error: allErr } = await supabase
  .from('employees')
  .select('id, full_name, email, status, invitation_expires_at')
  .order('invited_at', { ascending: false })
  .limit(10);

console.log('\n=== All Employees (Latest 10) ===');
if (allErr) {
  console.error('Error:', allErr.message);
} else {
  allEmp?.forEach(emp => {
    console.log(`  ${emp.full_name} | ${emp.email} | status: ${emp.status}`);
  });
}
