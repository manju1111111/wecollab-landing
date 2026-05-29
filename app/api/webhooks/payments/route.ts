import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Stripe Connect Payout Simulated Webhook Handler
 * Receives simulated Stripe checkouts or manual payment logs
 * and settles corresponding invoice ledger status to 'paid' in Supabase.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Support standard Stripe payload mapping & custom developer simulation triggers
    const invoiceId = 
      payload.data?.object?.metadata?.invoiceId || 
      payload.invoiceId || 
      payload.id;

    const paymentStatus = 
      payload.type === "checkout.session.completed" 
        ? "paid" 
        : (payload.status === "paid" ? "paid" : "paid"); // default to paid for simulation convenience

    if (!invoiceId) {
      console.warn("[PAYMENT_WEBHOOK] Blocked: No matching invoiceId provided.");
      return NextResponse.json({ error: "Missing target invoiceId in payload metadata" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Fetch matching invoice record to ensure validity
    const { data: existing, error: findError } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("id", invoiceId)
      .maybeSingle();

    if (findError) {
      console.error("[PAYMENT_WEBHOOK] Find invoice failed:", findError.message);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existing) {
      // If invoice not in DB (mock records or fallback active), return successful simulation log
      console.warn(`[PAYMENT_WEBHOOK] Simulated: Settle invoice ${invoiceId} (Record absent from DB - Mocking completion)`);
      return NextResponse.json({ 
        success: true, 
        message: "Invoice not found in physical database. Succeeded via active local mockup transaction.",
        simulatedId: invoiceId,
        status: paymentStatus 
      });
    }

    // 2. Persist state change to database
    const { data: settled, error: updateError } = await supabase
      .from("invoices")
      .update({ status: paymentStatus })
      .eq("id", invoiceId)
      .select();

    if (updateError) {
      console.error("[PAYMENT_WEBHOOK] Update failed:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[PAYMENT_WEBHOOK] Success: Invoice ${invoiceId} settled as ${paymentStatus}.`);
    return NextResponse.json({ success: true, settled });
  } catch (err: any) {
    console.error("[PAYMENT_WEBHOOK_EXCEPTION]", err);
    return NextResponse.json({ error: err.message || "Internal Webhook Exception" }, { status: 500 });
  }
}
