

async function fetchProduction() {
  console.log("=== FETCHING LIVE PRODUCTION ENDPOINT ===");
  try {
    const res = await fetch("https://www.wecollab.in/api/instagram/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "therock" })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("=== PRODUCTION RESPONSE JSON ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

fetchProduction();
