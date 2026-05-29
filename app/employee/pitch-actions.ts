"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface PitchPayload {
  employeeId: string;
  creatorId: string;
  templateType: "initial_outreach" | "pricing_offer" | "campaign_brief";
  subject: string;
  body: string;
}

/**
 * Creates and logs a creator pitching outreach email.
 * Includes graceful fallbacks if database tables aren't built yet.
 */
export async function sendCreatorPitch(payload: PitchPayload) {
  try {
    // Emulate SMTP network dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));

    const supabase = await createAdminClient();

    const { data: pitch, error } = await supabase
      .from("employee_pitches")
      .insert({
        employee_id: payload.employeeId,
        creator_id: payload.creatorId,
        template_type: payload.templateType,
        subject: payload.subject,
        body: payload.body,
        status: "sent",
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("does not exist")) {
        console.warn("[PITCH_ACTION] Table 'employee_pitches' not migrated. Emulating log insertion.");
        return {
          success: true,
          pitch: {
            id: `pitch-mock-${Date.now()}`,
            employee_id: payload.employeeId,
            creator_id: payload.creatorId,
            template_type: payload.templateType,
            subject: payload.subject,
            body: payload.body,
            status: "sent",
            sent_at: new Date().toISOString(),
          },
          isMock: true,
        };
      }
      console.error("[SEND_PITCH_ERROR]", error);
      return { error: error.message };
    }

    return { success: true, pitch };
  } catch (err: any) {
    console.error("[SEND_PITCH_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Fetches all pitches sent to a specific creator.
 */
export async function fetchCreatorPitches(creatorId: string) {
  try {
    const supabase = await createAdminClient();

    const { data: pitches, error } = await supabase
      .from("employee_pitches")
      .select("*")
      .eq("creator_id", creatorId)
      .order("sent_at", { ascending: false });

    if (error) {
      if (error.message.includes("does not exist")) {
        // Safe mock fallback for demos
        return {
          pitches: [
            {
              id: "pitch-demo-1",
              employee_id: "emp-mock",
              creator_id: creatorId,
              template_type: "initial_outreach",
              subject: "Collaboration Query — WeCollab Branding",
              body: "Hi! We absolutely loved your recent fashion reel and would love to work with you on our Nike 2026 athletic briefs. Let us know if you're interested!",
              status: "opened",
              sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "pitch-demo-2",
              employee_id: "emp-mock",
              creator_id: creatorId,
              template_type: "pricing_offer",
              subject: "Compensation Proposal — Nike Activewear",
              body: "Thanks for your interest! We want to offer you ₹6,50,000 for 1 dynamic reel and 2 high-resolution static stories. Let us know if we can proceed with this proposal.",
              status: "replied",
              sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          isMock: true,
        };
      }
      console.error("[FETCH_PITCHES_ERROR]", error);
      return { error: error.message };
    }

    return { pitches: pitches || [], isMock: false };
  } catch (err: any) {
    console.error("[FETCH_PITCHES_CRITICAL]", err);
    return { error: err.message };
  }
}
