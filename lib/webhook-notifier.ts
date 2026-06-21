/**
 * Sends a notification message to Slack and/or Discord webhooks for free.
 * Uses environment variables SLACK_WEBHOOK_URL and DISCORD_WEBHOOK_URL.
 * 
 * @param message The raw notification text
 * @param isError If true, prefixes the alert with error indicators
 */
export async function sendWebhookNotification(message: string, isError = false): Promise<{ success: boolean; error?: string }> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!slackUrl && !discordUrl) {
    console.log(`[WEBHOOK_NOTIFIER] Simulating alert (no webhook URLs configured in environment):`);
    console.log(`[ALERT] ${isError ? "🚨 ERROR:" : "ℹ️ INFO:"} ${message}`);
    return { success: true };
  }

  const prefix = isError ? "🚨 *[WeCollab Sync Alert]* " : "✅ *[WeCollab Sync Report]* ";
  const fullMessage = `${prefix}${message}`;

  let success = true;
  let errorMsg = "";

  // 1. Send to Slack if configured
  if (slackUrl) {
    try {
      console.log(`[WEBHOOK_NOTIFIER] Dispatching alert to Slack...`);
      const response = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullMessage,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[WEBHOOK_NOTIFIER_SLACK_WARN] Slack webhook failed with status ${response.status}: ${text}`);
        success = false;
        errorMsg += `Slack failed (${response.status}). `;
      } else {
        console.log(`[WEBHOOK_NOTIFIER] Successfully sent to Slack.`);
      }
    } catch (e: any) {
      console.error("[WEBHOOK_NOTIFIER_SLACK_ERROR]", e);
      success = false;
      errorMsg += `Slack exception (${e.message}). `;
    }
  }

  // 2. Send to Discord if configured
  if (discordUrl) {
    try {
      console.log(`[WEBHOOK_NOTIFIER] Dispatching alert to Discord...`);
      
      // Discord uses slightly different markdown formatting, clean bold markers
      const cleanDiscordMessage = fullMessage.replace(/\*/g, "**");

      const response = await fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: cleanDiscordMessage,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[WEBHOOK_NOTIFIER_DISCORD_WARN] Discord webhook failed with status ${response.status}: ${text}`);
        success = false;
        errorMsg += `Discord failed (${response.status}). `;
      } else {
        console.log(`[WEBHOOK_NOTIFIER] Successfully sent to Discord.`);
      }
    } catch (e: any) {
      console.error("[WEBHOOK_NOTIFIER_DISCORD_ERROR]", e);
      success = false;
      errorMsg += `Discord exception (${e.message}). `;
    }
  }

  return { success, error: errorMsg ? errorMsg.trim() : undefined };
}
