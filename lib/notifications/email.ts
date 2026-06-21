"use server";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a highly styled email using Resend's REST API.
 * Falls back cleanly to console logs if RESEND_API_KEY is not defined.
 */
async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n" + "=".repeat(60));
    console.log(`[EMAIL DISPATCH SIMULATION]`);
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Status:  Success (Logged in console due to missing RESEND_API_KEY)`);
    console.log("-".repeat(60));
    console.log(`Body (Stripped HTML):`);
    console.log(payload.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300) + "...");
    console.log("=".repeat(60) + "\n");
    return { success: true, isSimulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: "WeCollab <updates@wecollab.in>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err: any) {
    console.error("[EMAIL_DISPATCH_ERROR]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch task assignment email to employee.
 */
export async function sendTaskAssignmentEmail({
  to,
  employeeName,
  taskTitle,
  dueDate
}: {
  to: string;
  employeeName: string;
  taskTitle: string;
  dueDate?: string | null;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 6px;">New Task Assigned 📋</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${employeeName},</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Admin has pushed a new campaign task to your active workspace feed:</p>
      <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin: 0;">"${taskTitle}"</p>
        ${dueDate ? `<p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Due by: ${dueDate}</p>` : ""}
      </div>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Please review and update this task's status as you progress.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent automatically by WeCollab Integration Hub.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[WeCollab] New Task Assigned: ${taskTitle}`,
    html
  });
}

/**
 * Dispatch deal closed celebration email to admins and brands.
 */
export async function sendDealClosedEmail({
  to,
  brandName,
  employeeName,
  creatorName,
  amount
}: {
  to: string;
  brandName: string;
  employeeName: string;
  creatorName: string;
  amount?: number | null;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #10b981; margin-bottom: 6px;">Deal Closed! 🎉</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Dear Partners,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">We are thrilled to announce that WeCollab campaign manager <strong>${employeeName}</strong> has successfully closed a creator partnership deal for <strong>${brandName}</strong>!</p>
      <div style="padding: 16px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 15px; font-weight: bold; color: #064e3b; margin: 0;">Creator: ${creatorName}</p>
        ${amount ? `<p style="font-size: 14px; font-weight: bold; color: #047857; margin: 4px 0 0 0;">payout: ₹${amount.toLocaleString()}</p>` : ""}
      </div>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Smart agreements and payout invoices have been automatically compiled and sent to your brand overview portal.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent automatically by WeCollab Integration Hub.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🎉 [WeCollab] Deal Closed with ${creatorName}!`,
    html
  });
}

/**
 * Dispatch contract sign confirmation email to brand and employee.
 */
export async function sendContractSignedEmail({
  to,
  brandName,
  creatorName,
  campaignName,
  payoutAmount
}: {
  to: string;
  brandName: string;
  creatorName: string;
  campaignName: string;
  payoutAmount: number;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #6366f1; margin-bottom: 6px;">Contract Signed & Binding ✍️</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">This is to confirm that the campaign collaboration contract between <strong>${brandName}</strong> and <strong>${creatorName}</strong> has been successfully signed by both parties.</p>
      <div style="padding: 16px; background-color: #e0e7ff; border-left: 4px solid #6366f1; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 14px; font-weight: bold; color: #1e1b4b; margin: 0;">Campaign: ${campaignName}</p>
        <p style="font-size: 14px; font-weight: bold; color: #312e81; margin: 4px 0 0 0;">Payout: ₹${payoutAmount.toLocaleString()}</p>
      </div>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Campaign tracking briefs are now active. Payment settlement invoices are accessible inside the billing dashboards.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent automatically by WeCollab Integration Hub.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `✍️ [WeCollab] Contract Signed: ${campaignName}`,
    html
  });
}

/**
 * Dispatch password reset email to brand.
 */
export async function sendPasswordResetEmail({
  to,
  token,
  resetUrl
}: {
  to: string;
  token: string;
  resetUrl: string;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #7166e5; margin-bottom: 6px;">Password Reset Request 🔑</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">We received a request to reset the password for your WeCollab brand account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #7166e5; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 9999px; font-size: 13px;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.6;">If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.</p>
      <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px;">Or copy and paste this link in your browser: <br/><a href="${resetUrl}" style="color: #7166e5; text-decoration: underline;">${resetUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent automatically by WeCollab Integration Hub.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🔑 [WeCollab] Reset Your Password`,
    html
  });
}

