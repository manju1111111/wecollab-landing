import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper to check if text is a single valid HTTP/S URL
function isUrl(text: string): boolean {
  try {
    const trimmed = text.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return false;
    }
    // Ensure no whitespace
    if (/\s/.test(trimmed)) {
      return false;
    }
    new URL(trimmed);
    return true;
  } catch (_) {
    return false;
  }
}

// Clean HTML to readable text for the LLM
function cleanHtml(html: string): string {
  let cleaned = html;
  // Remove script and style tags
  cleaned = cleaned.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  // Remove comment tags
  cleaned = cleaned.replace(/<!--([\s\S]*?)-->/g, '');
  
  // Extract body if present to avoid head content
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1];
  }

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Compress multiple whitespace spaces/newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Truncate to avoid exceeding token windows
  if (cleaned.length > 25000) {
    cleaned = cleaned.substring(0, 25000) + "... [content truncated]";
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const { content, mode } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "No content provided for import" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is missing in environment variables" }, { status: 500 });
    }

    let rawContent = content.trim();
    let isScrapedUrl = false;

    // Check if the pasted content is a single URL to fetch
    if (isUrl(rawContent)) {
      try {
        const fetchRes = await fetch(rawContent, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          next: { revalidate: 60 } // cache for 60 seconds
        });
        
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          rawContent = `Source URL: ${rawContent}\n\nWebpage content:\n${cleanHtml(html)}`;
          isScrapedUrl = true;
        }
      } catch (err: any) {
        console.warn("Failed to scrape URL, fallback to raw text:", err);
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let modeInstructions = "";
    if (mode === "news") {
      modeInstructions = `
CRITICAL STRUCTURE (NEWS MODE):
You must format the markdown content to include these specific sections:
- Headline (do not put # title inside content field since the editor has a separate title field. Start directly with the summary or introduction)
- Summary: A brief bold introduction
- "Key Developments" (a bulleted list summarizing the major events/updates)
- "Timeline of Events" (a chronological timeline of how the story unfolded)
- "Industry Impact" (analysis of the wider consequences for the sector)
- "Expert Insights" (quotes, expert comments, or insights regarding the topic)
- "Final Takeaway" (conclusion and looking forward)
`;
    } else if (mode === "creator") {
      modeInstructions = `
CRITICAL STRUCTURE (CREATOR ECONOMY MODE):
You must format the markdown content to include these specific sections:
- Trend Analysis (detailed analysis of the creators/brands/marketing trend)
- "Why It Matters" (explanation of why this trend is significant right now)
- "Impact on Creators" (bulleted breakdown of monetization or content strategy implications)
- "Impact on Brands" (bulleted breakdown of advertising, partnership, or brand implications)
- "Industry Implications" (broader business and social media ecosystem implications)
- "Actionable Insights" (a numbered list of clear, actionable steps for stakeholders)
`;
    } else if (mode === "standard") {
      modeInstructions = `
CRITICAL STRUCTURE (STANDARD MODE):
You must format the markdown content to include these specific sections:
- An engaging Featured Excerpt/Introduction
- Well-organized sections with descriptive Subheadings (##)
- Bullet points or lists where helpful
- "Key Takeaways" (a bulleted list of main conclusions)
- "Conclusion" (final summary and call to action)
`;
    } else {
      // auto-detect
      modeInstructions = `
First, detect the content type:
- If the content is primarily news, a press release, or an event report, adopt "NEWS MODE".
- If the content relates to content creators, brands, marketing, Instagram, YouTube, TikTok, advertising, influencer marketing, or social media, adopt "CREATOR ECONOMY MODE".
- Otherwise, adopt "STANDARD MODE".

Follow these structural templates based on the mode you choose (do not include # title inside content field since the editor has a separate title field):
1. NEWS MODE:
   - Summary paragraph
   - "Key Developments" (bulleted list)
   - "Timeline of Events" (chronological list)
   - "Industry Impact" (broader consequences)
   - "Expert Insights" (quotes or insights)
   - "Final Takeaway" (conclusion)

2. CREATOR ECONOMY MODE:
   - "Trend Analysis"
   - "Why It Matters"
   - "Impact on Creators" (bulleted list)
   - "Impact on Brands" (bulleted list)
   - "Industry Implications"
   - "Actionable Insights" (numbered list)

3. STANDARD MODE:
   - Featured Excerpt/Introduction
   - Subheaded sections (##)
   - "Key Takeaways" (bulleted list)
   - "Conclusion" (final summary)
`;
    }

    const prompt = `
You are an expert content creator, copywriter, and SEO strategist.
Your task is to analyze the provided raw content, clean it up, and format it into a professional, highly readable blog post or newsletter.

Here is the raw content to import:
"""
${rawContent}
"""

${modeInstructions}

## CRITICAL INSTRUCTIONS:
1. **Cleaning**: Remove duplicate paragraphs, irrelevant ads, cookie warnings, website headers/footers, and clean up formatting, spelling, capitalization, and grammar. Fix spacing and punctuation.
2. **Category**: Choose the single most appropriate category for this article from the following list of default categories:
   - "Creator Economy"
   - "Platform Insights"
   - "Business"
   - "Industry Trends"
3. **Tags**: Suggest 3 to 6 short, professional search tags (comma-separated or list).
4. **Metadata**: Generate a short URL slug (lowercase, hyphen-separated, e.g., "my-new-post"), an SEO Title (max 60 characters), and an SEO Meta Description (max 160 characters).
5. **Formatting**: Ensure the main article content is returned in beautiful, clean Markdown. Use headings (##, ###), paragraphs, lists (- or *), quotes (>), callouts, and statistics appropriately. Use image placeholders (e.g. ![Image Description](image-url)) only where relevant to structure the article. Do not include the main # title inside the content field (since it is populated in the editor's title field).

You MUST respond with a single RAW JSON object. Do not include any markdown backticks (e.g. \`\`\`json) or extra text. The response must parse as valid JSON.
JSON keys:
- "detectedType": (string, e.g. "News", "Creator Economy Topic", "Marketing Update", "Press Release", etc.)
- "category": (string, must be one of the four default categories above)
- "title": (string, SEO-friendly, catchy, professional article title)
- "summary": (string, 1-2 sentence compelling summary/featured excerpt of the article)
- "tags": (array of strings)
- "content": (string, the complete, structured, and cleaned article content in Markdown format, following the chosen structure)
- "seoTitle": (string, SEO meta title, max 60 chars)
- "seoDescription": (string, SEO meta description, max 160 chars)
- "slug": (string, URL-friendly slug based on the title, lowercase and hyphens only)
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up markdown code blocks if the AI accidentally adds them
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(cleanJson);
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      isScrapedUrl
    });
  } catch (error: any) {
    console.error("Import AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process import content" }, { status: 500 });
  }
}
