import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const apiKeyPresent = !!process.env.GEMINI_API_KEY;
  const apiKeyLength = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0;
  const apiKeyPrefix = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 7) : "none";

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on Vercel.",
      details: { apiKeyPresent, apiKeyLength }
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Respond with the word 'OK' only.");
    const text = result.response.text().trim();

    return NextResponse.json({
      success: true,
      message: "Gemini connection test passed!",
      response: text,
      details: { apiKeyPresent, apiKeyLength, apiKeyPrefix }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      details: {
        apiKeyPresent,
        apiKeyLength,
        apiKeyPrefix,
        stack: error.stack,
        rawError: error
      }
    }, { status: 500 });
  }
}
