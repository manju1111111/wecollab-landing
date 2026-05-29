"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveCreatorNote({
  employeeId,
  creatorId,
  noteText,
  dealStatus,
}: {
  employeeId: string;
  creatorId: string;
  noteText: string;
  dealStatus: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_creator_notes")
    .upsert(
      { employee_id: employeeId, creator_id: creatorId, note_text: noteText, deal_status: dealStatus },
      { onConflict: "employee_id,creator_id" }
    );

  if (error) {
    console.error("[SAVE_NOTE_ERROR]", error.message);
    return { error: error.message };
  }

  // Trigger notification to admin
  try {
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name, email")
      .eq("id", employeeId)
      .single();
    
    const { data: creator } = await supabase
      .from("creators")
      .select("name")
      .eq("id", creatorId)
      .single();

    const empName = emp?.full_name || "Employee";
    const creatorName = creator?.name || "a creator";

    const { createNotification } = await import("@/lib/supabase/notifications");
    await createNotification({
      userId: "00000000-0000-0000-0000-000000000000",
      userType: "admin",
      type: dealStatus === "deal_closed" ? "deal_update" : "note_update",
      title: dealStatus === "deal_closed" ? "Deal Closed! 🎉" : "Creator Note Saved 📝",
      body: dealStatus === "deal_closed" 
        ? `${empName} closed the deal with ${creatorName}!` 
        : `${empName} logged a note for ${creatorName} (${dealStatus}).`,
      link: `/admin/employees/${employeeId}`
    });

    if (dealStatus === "deal_closed") {
      let brandEmail = "brand@wecollab.in";
      let brandName = "Brand Partner";
      let amount: number | null = null;
      try {
        const { data: cc } = await supabase
          .from("campaign_creators")
          .select("campaign_id, price")
          .eq("creator_id", creatorId)
          .limit(1);
        
        if (cc && cc.length > 0) {
          if (cc[0].price) amount = Number(cc[0].price);
          if (cc[0].campaign_id) {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("brand_id")
              .eq("id", cc[0].campaign_id)
              .single();
            
            if (campaign?.brand_id) {
              const { data: brand } = await supabase
                .from("brands")
                .select("email, name")
                .eq("id", campaign.brand_id)
                .single();
              
              if (brand?.email) {
                brandEmail = brand.email;
                brandName = brand.name || "Brand Partner";
              }
            }
          }
        } else {
          const { data: brands } = await supabase
            .from("brands")
            .select("email, name")
            .limit(1);
          if (brands && brands.length > 0) {
            brandEmail = brands[0].email;
            brandName = brands[0].name || "Brand Partner";
          }
        }
      } catch (e) {
        console.warn("[DEAL_CLOSED_BRAND_FETCH_ERROR]", e);
      }

      const { sendDealClosedEmail } = await import("@/lib/notifications/email");
      if (brandEmail) {
        await sendDealClosedEmail({
          to: brandEmail,
          brandName,
          employeeName: empName,
          creatorName,
          amount
        });
      }
      if (emp?.email) {
        await sendDealClosedEmail({
          to: emp.email,
          brandName,
          employeeName: empName,
          creatorName,
          amount
        });
      }
    }
  } catch (notifErr) {
    console.error("[SAVE_NOTE_NOTIF_ERROR]", notifErr);
  }

  revalidatePath("/employee");
  revalidatePath("/employee/creators");
  return { success: true };
}

export async function updateDealStatus({
  employeeId,
  creatorId,
  dealStatus,
}: {
  employeeId: string;
  creatorId: string;
  dealStatus: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_creator_notes")
    .upsert(
      { employee_id: employeeId, creator_id: creatorId, deal_status: dealStatus },
      { onConflict: "employee_id,creator_id" }
    );

  if (error) {
    console.error("[UPDATE_DEAL_STATUS]", error.message);
    return { error: error.message };
  }

  // Trigger notification to admin
  try {
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name, email")
      .eq("id", employeeId)
      .single();
    
    const { data: creator } = await supabase
      .from("creators")
      .select("name")
      .eq("id", creatorId)
      .single();

    const empName = emp?.full_name || "Employee";
    const creatorName = creator?.name || "a creator";

    const { createNotification } = await import("@/lib/supabase/notifications");
    await createNotification({
      userId: "00000000-0000-0000-0000-000000000000",
      userType: "admin",
      type: dealStatus === "deal_closed" ? "deal_update" : "deal_stage",
      title: dealStatus === "deal_closed" ? "Deal Closed! 🎉" : "Pipeline Update 📈",
      body: dealStatus === "deal_closed" 
        ? `${empName} closed the deal with ${creatorName}!` 
        : `${empName} moved ${creatorName} to "${dealStatus}".`,
      link: `/admin/employees/${employeeId}`
    });

    if (dealStatus === "deal_closed") {
      let brandEmail = "brand@wecollab.in";
      let brandName = "Brand Partner";
      let amount: number | null = null;
      try {
        const { data: cc } = await supabase
          .from("campaign_creators")
          .select("campaign_id, price")
          .eq("creator_id", creatorId)
          .limit(1);
        
        if (cc && cc.length > 0) {
          if (cc[0].price) amount = Number(cc[0].price);
          if (cc[0].campaign_id) {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("brand_id")
              .eq("id", cc[0].campaign_id)
              .single();
            
            if (campaign?.brand_id) {
              const { data: brand } = await supabase
                .from("brands")
                .select("email, name")
                .eq("id", campaign.brand_id)
                .single();
              
              if (brand?.email) {
                brandEmail = brand.email;
                brandName = brand.name || "Brand Partner";
              }
            }
          }
        } else {
          const { data: brands } = await supabase
            .from("brands")
            .select("email, name")
            .limit(1);
          if (brands && brands.length > 0) {
            brandEmail = brands[0].email;
            brandName = brands[0].name || "Brand Partner";
          }
        }
      } catch (e) {
        console.warn("[DEAL_CLOSED_BRAND_FETCH_ERROR]", e);
      }

      const { sendDealClosedEmail } = await import("@/lib/notifications/email");
      if (brandEmail) {
        await sendDealClosedEmail({
          to: brandEmail,
          brandName,
          employeeName: empName,
          creatorName,
          amount
        });
      }
      if (emp?.email) {
        await sendDealClosedEmail({
          to: emp.email,
          brandName,
          employeeName: empName,
          creatorName,
          amount
        });
      }
    }
  } catch (notifErr) {
    console.error("[UPDATE_DEAL_NOTIF_ERROR]", notifErr);
  }

  revalidatePath("/employee");
  revalidatePath("/employee/pipeline");
  return { success: true };
}

export async function submitCreatorForReview({
  employeeId,
  creatorId,
  updatedFields,
}: {
  employeeId: string;
  creatorId: string;
  updatedFields: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    followers?: number;
    category?: string;
  };
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("creators")
    .update({
      ...updatedFields,
      verification_status: "Ready for Review",
    })
    .eq("id", creatorId);

  if (error) {
    console.error("[SUBMIT_FOR_REVIEW_ERROR]", error.message);
    return { error: error.message };
  }

  try {
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employeeId)
      .single();
    
    const { data: creator } = await supabase
      .from("creators")
      .select("name, username")
      .eq("id", creatorId)
      .single();

    const empName = emp?.full_name || "Employee";
    const creatorName = creator?.username || creator?.name || "a creator";

    const { createNotification } = await import("@/lib/supabase/notifications");
    await createNotification({
      userId: "00000000-0000-0000-0000-000000000000",
      userType: "admin",
      type: "creator_review",
      title: "Creator Ready for Review 📝",
      body: `${empName} completed manual verification for @${creatorName} and submitted it for review.`,
      link: "/admin/creators"
    });
  } catch (notifErr) {
    console.error("[SUBMIT_FOR_REVIEW_NOTIF_ERROR]", notifErr);
  }

  revalidatePath("/employee");
  revalidatePath("/employee/creators");
  revalidatePath("/admin/creators");
  return { success: true };
}

