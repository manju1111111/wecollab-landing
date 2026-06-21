const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
  try {
    console.log("Listing models...");
    // Using standard API to fetch list of models
    // Actually, in the SDK, listModels might not be directly exposed the same way or it is
    // Let's use fetch directly to be 100% sure we get a raw list from Google API
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
    } else {
      console.log("Response:", data);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

list();
