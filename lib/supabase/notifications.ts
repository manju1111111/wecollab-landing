import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface NotificationPayload {
  userId: string;
  userType: "admin" | "employee";
  type: string;
  title: string;
  body: string;
  link?: string;
}

/**
 * Creates and inserts a notification into the database.
 * Fails gracefully if the notifications table does not exist yet.
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: payload.userId,
        user_type: payload.userType,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link || null,
        read: false,
      });

    if (error) {
      if (error.message.includes("does not exist")) {
        console.warn(
          `[NOTIFICATION_HELPER] Notifications table does not exist. Skipped inserting notification: "${payload.title}"`
        );
        return { success: true, isMocked: true };
      }
      console.error("[NOTIFICATION_HELPER_ERROR]", error);
      return { success: false, error: error.message };
    }

    // Attempt to broadcast using Supabase Realtime Channel if table exists
    try {
      const channel = supabase.channel(`notifications:${payload.userId}`);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "new-notification",
        payload: {
          title: payload.title,
          body: payload.body,
          type: payload.type,
          link: payload.link,
        },
      });
      await supabase.removeChannel(channel);
    } catch (realtimeErr) {
      // Realtime broadcast is optional, fail silently
    }

    return { success: true };
  } catch (err: any) {
    console.error("[NOTIFICATION_HELPER_CRITICAL]", err);
    return { success: false, error: err.message };
  }
}
