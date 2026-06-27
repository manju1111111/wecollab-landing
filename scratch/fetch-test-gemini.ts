async function run() {
  console.log("=== CALLING GEMINI DIAGNOSTICS ENDPOINT ON PRODUCTION ===");
  try {
    const res = await fetch("https://www.wecollab.in/api/instagram/test-gemini");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("=== DIAGNOSTICS RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("Fetch failed:", e.message);
  }
}

run();
