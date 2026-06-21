const apiKey = "re_TS8f8EWJ_3qeHabG2L74juUDM9W6d8QTi";

async function sendTest() {
  console.log("Sending test email from verified domain updates@wecollab.in...");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: "WeCollab <updates@wecollab.in>",
        to: "btips67@gmail.com",
        subject: "🔑 [WeCollab] Test Reset Email",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #7166e5; margin-bottom: 6px;">Password Reset Test 🔑</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">If you receive this email, your verified domain sending is working perfectly!</p>
          </div>
        `
      })
    });

    const data = await res.json();
    console.log("HTTP Status:", res.status);
    console.log("Resend API Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Connection failed:", e.message);
  }
}

sendTest();
