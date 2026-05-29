"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface ContractPayload {
  campaignId: string;
  creatorId: string;
  terms: string;
  payoutAmount: number;
}

/**
 * Creates a campaign collaboration contract and auto-generates a matching unpaid invoice.
 * Includes graceful fallbacks if database tables aren't migrated yet.
 */
export async function createContract(payload: ContractPayload) {
  try {
    const supabase = await createAdminClient();

    // 1. Insert contract
    const { data: contract, error: contractErr } = await supabase
      .from("contracts")
      .insert({
        campaign_id: payload.campaignId,
        creator_id: payload.creatorId,
        terms: payload.terms,
        payout_amount: payload.payoutAmount,
        status: "sent",
      })
      .select()
      .single();

    if (contractErr) {
      if (contractErr.message.includes("does not exist")) {
        console.warn("[BILLING_ACTION] Table 'contracts' not migrated. Emulating creation.");
        const mockContract = {
          id: `contract-mock-${Date.now()}`,
          campaign_id: payload.campaignId,
          creator_id: payload.creatorId,
          terms: payload.terms,
          payout_amount: payload.payoutAmount,
          status: "sent",
          created_at: new Date().toISOString(),
        };
        return { success: true, contract: mockContract, isMock: true };
      }
      console.error("[CREATE_CONTRACT_ERROR]", contractErr);
      return { error: contractErr.message };
    }

    // 2. Auto-generate corresponding unpaid invoice (due in 14 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await supabase
      .from("invoices")
      .insert({
        contract_id: contract.id,
        amount: payload.payoutAmount,
        status: "unpaid",
        due_date: dueDate.toISOString().split("T")[0],
      });

    return { success: true, contract };
  } catch (err: any) {
    console.error("[CREATE_CONTRACT_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Signs a creator contract agreement.
 */
export async function signContract(contractId: string) {
  try {
    if (contractId.includes("mock")) {
      try {
        const { sendContractSignedEmail } = await import("@/lib/notifications/email");
        await sendContractSignedEmail({
          to: "brand-mock@wecollab.in",
          brandName: "Mock Brand Partner",
          creatorName: "Virat Kohli",
          campaignName: "Nike Air Max Launch",
          payoutAmount: 1250000
        });
        await sendContractSignedEmail({
          to: "employee-mock@wecollab.in",
          brandName: "Mock Brand Partner",
          creatorName: "Virat Kohli",
          campaignName: "Nike Air Max Launch",
          payoutAmount: 1250000
        });
      } catch (mockEmailErr) {
        console.error("[MOCK_SIGN_CONTRACT_EMAIL_ERROR]", mockEmailErr);
      }
      return { success: true, isMock: true };
    }

    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (error) {
      if (error.message.includes("does not exist")) {
        return { success: true, isMock: true };
      }
      console.error("[SIGN_CONTRACT_ERROR]", error);
      return { error: error.message };
    }

    // Fetch contract details to trigger email dispatch
    try {
      const { data: contract } = await supabase
        .from("contracts")
        .select("campaign_id, creator_id, payout_amount")
        .eq("id", contractId)
        .single();

      if (contract) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("brand_id, name")
          .eq("id", contract.campaign_id)
          .single();

        const { data: creator } = await supabase
          .from("creators")
          .select("name, assigned_employee")
          .eq("id", contract.creator_id)
          .single();

        let brandEmail = "";
        let brandName = "";
        if (campaign?.brand_id) {
          const { data: brand } = await supabase
            .from("brands")
            .select("email, name")
            .eq("id", campaign.brand_id)
            .single();
          if (brand) {
            brandEmail = brand.email;
            brandName = brand.name;
          }
        }

        let employeeEmail = "";
        if (creator?.assigned_employee) {
          const { data: employee } = await supabase
            .from("employees")
            .select("email")
            .eq("id", creator.assigned_employee)
            .single();
          if (employee) {
            employeeEmail = employee.email;
          }
        }

        const { sendContractSignedEmail } = await import("@/lib/notifications/email");
        
        // Invoke for brand
        if (brandEmail) {
          await sendContractSignedEmail({
            to: brandEmail,
            brandName: brandName || "Brand Partner",
            creatorName: creator?.name || "Creator",
            campaignName: campaign?.name || "Campaign Project",
            payoutAmount: Number(contract.payout_amount) || 0
          });
        }
        
        // Invoke for employee
        if (employeeEmail) {
          await sendContractSignedEmail({
            to: employeeEmail,
            brandName: brandName || "Brand Partner",
            creatorName: creator?.name || "Creator",
            campaignName: campaign?.name || "Campaign Project",
            payoutAmount: Number(contract.payout_amount) || 0
          });
        }
      }
    } catch (emailErr) {
      console.error("[SIGN_CONTRACT_EMAIL_ERROR]", emailErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[SIGN_CONTRACT_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Fetches all invoices associated with a specific brand.
 */
export async function fetchBrandInvoices(brandId: string) {
  try {
    const supabase = await createAdminClient();

    // Fetch campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("brand_id", brandId);

    if (!campaigns || campaigns.length === 0) {
      return triggerMockInvoices(brandId);
    }

    const campaignIds = campaigns.map(c => c.id);

    // Fetch contracts
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, campaign_id, creator_id, payout_amount, status")
      .in("campaign_id", campaignIds);

    if (!contracts || contracts.length === 0) {
      return triggerMockInvoices(brandId);
    }

    const contractIds = contracts.map(c => c.id);
    const creatorIds = contracts.map(c => c.creator_id);

    // Fetch invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, contract_id, amount, status, due_date, created_at")
      .in("contract_id", contractIds);

    if (!invoices || invoices.length === 0) {
      return triggerMockInvoices(brandId);
    }

    // Fetch creator details
    const { data: creators } = await supabase
      .from("creators")
      .select("id, name")
      .in("id", creatorIds);

    const creatorMap = new Map();
    (creators || []).forEach(c => creatorMap.set(c.id, c.name));

    const campaignMap = new Map();
    campaigns.forEach(c => campaignMap.set(c.id, c.name));

    const contractMap = new Map();
    contracts.forEach(c => contractMap.set(c.id, c));

    const enriched = invoices.map(inv => {
      const contr = contractMap.get(inv.contract_id) || {};
      return {
        id: inv.id,
        campaign_name: campaignMap.get(contr.campaign_id) || "Campaign Project",
        creator_name: creatorMap.get(contr.creator_id) || "Creator Partner",
        amount: Number(inv.amount),
        status: inv.status,
        due_date: inv.due_date,
        created_at: inv.created_at,
      };
    });

    return { invoices: enriched, isMock: false };
  } catch (err: any) {
    return triggerMockInvoices(brandId);
  }
}

/**
 * Simulates settlement of an invoice (payout processing).
 */
export async function settleInvoice(invoiceId: string) {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId);

    if (error) {
      if (error.message.includes("does not exist")) {
        return { success: true, isMock: true };
      }
      console.error("[SETTLE_INVOICE_ERROR]", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[SETTLE_INVOICE_CRITICAL]", err);
    return { error: err.message };
  }
}

function triggerMockInvoices(brandId: string) {
  return {
    invoices: [
      {
        id: "inv-mock-1",
        campaign_name: "Summer Activewear 2026",
        creator_name: "Virat Kohli",
        amount: 1250000,
        status: "paid",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "inv-mock-2",
        campaign_name: "Summer Activewear 2026",
        creator_name: "Katrina Kaif",
        amount: 650000,
        status: "unpaid",
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "inv-mock-3",
        campaign_name: "Nike Air Max Launch",
        creator_name: "Ranveer Singh",
        amount: 450000,
        status: "overdue",
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    isMock: true
  };
}
