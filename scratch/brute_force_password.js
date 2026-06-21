const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbHost = "aws-1-ap-southeast-2.pooler.supabase.com";
const dbUser = "postgres.xkssgycaqwjqajipoooy";
const dbName = "postgres";

const passwordsToTest = [
  'manju1111111',
  'Manju@123',
  'manju123',
  'wecollab',
  'postgres'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPasswords() {
  console.log("Starting database password verification with cooldowns...");
  
  for (const password of passwordsToTest) {
    console.log(`Testing password: "${password}"...`);
    const client = new Client({
      host: dbHost,
      port: 6543,
      user: dbUser,
      password: password,
      database: dbName,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`\n>>> SUCCESS! Correct password is: "${password}"`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`Result: ${e.message}`);
      await client.end().catch(() => {});
      
      if (e.message.includes('circuit_breaker') || e.message.includes('blocked')) {
        console.log("Circuit breaker active, waiting 45 seconds to cool down...");
        await sleep(45000);
      } else {
        console.log("Authentication failed. Waiting 10 seconds before next attempt...");
        await sleep(10000);
      }
    }
  }
  
  console.log("Tested all candidate passwords.");
}

testPasswords();
