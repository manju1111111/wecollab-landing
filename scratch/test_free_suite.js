const { verifyEmail } = require('../lib/email-verifier');
const { sendWebhookNotification } = require('../lib/webhook-notifier');
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log("=== Testing DNS Email Verification ===");
  
  const emailsToTest = [
    "support@gmail.com", // valid format & domain
    "collabs@royalchallengers.com", // valid format & domain
    "fake-user@nonexistent-domain-12345-xyz.com", // invalid domain (no MX records)
    "invalid-email-format", // invalid format
  ];

  for (const email of emailsToTest) {
    const isValid = await verifyEmail(email);
    console.log(`Email: "${email}" -> Result: ${isValid ? "VALID ✅" : "INVALID ❌"}\n`);
  }

  console.log("=== Testing Slack/Discord Webhook Notifier ===");
  // Will simulate an alert in the console if no webhook URLs are provided in env
  const result = await sendWebhookNotification("This is a local verification alert test for WeCollab free suite.", false);
  console.log("Webhook dispatch result:", result);
}

test();
