// lib/articles/generator.ts

import fetch from 'node-fetch';

export type Newsletter = {
  id?: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  cover_image?: string;
  category?: string;
  tags?: string[];
  author_name?: string;
  author_avatar?: string;
  is_published?: boolean;
  published_at?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  featured_image_prompt?: string | null;
  excerpt?: string | null;
  faq?: any;
  internal_links?: any;
  schema_markup?: any;
  created_at?: string;
};

const TOPICS = [
  "Influencer Marketing",
  "Instagram Influencers",
  "YouTube Creators",
  "LinkedIn Creators",
  "Tech Influencers",
  "Food Influencers",
  "Fitness Influencers",
  "Gaming Creators",
  "Finance Creators",
  "Bangalore Influencers",
  "Mumbai Influencers",
  "Delhi Influencers",
  "Creator Economy",
  "Brand Collaborations",
  "Social Media Marketing"
];

/**
 * Generate a single article using OpenAI's chat completion.
 * Returns a Newsletter object that matches the DB schema.
 */
export async function generateArticle(topic: string): Promise<Newsletter> {
  const systemPrompt = `You are an expert content writer. Write a SEO‑optimized newsletter article for the given topic. Return a JSON object with the following fields:
    - title (SEO title)
    - slug (URL friendly, lower‑case, hyphens)
    - summary (short meta description, 150‑180 chars)
    - content (Markdown, 1500‑2500 words)
    - featured_image_prompt (prompt for an image generation service)
    - excerpt (one‑sentence teaser)
    - faq (array of {question, answer})
    - internal_links (array of URLs to related articles)
    - schema_markup (JSON‑LD string for Article schema)
    - tags (array of relevant tags)
    - category (use the provided topic as category)
  Ensure the JSON is valid and no additional text.`;

  const userPrompt = `Write an article about "${topic}" following the guidelines above.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI request failed: ${err}`);
  }

  const data = (await response.json()) as any;
  const jsonStr = data.choices?.[0]?.message?.content;
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse OpenAI JSON response');
  }

  // Ensure required fields exist
  return {
    title: parsed.title,
    slug: parsed.slug,
    summary: parsed.summary,
    content: parsed.content,
    cover_image: undefined,
    category: topic,
    tags: parsed.tags || [],
    author_name: "WeCollab Team",
    author_avatar: "/assets/logo.jpg",
    is_published: false,
    seo_title: parsed.title,
    seo_description: parsed.summary,
    featured_image_prompt: parsed.featured_image_prompt,
    excerpt: parsed.excerpt,
    faq: parsed.faq,
    internal_links: parsed.internal_links,
    schema_markup: parsed.schema_markup,
    created_at: new Date().toISOString()
  };
}

/**
 * Helper to generate an array of 50 article objects.
 */
export async function generateFifty(): Promise<Newsletter[]> {
  const results: Newsletter[] = [];
  // Repeat topics to reach 50
  for (let i = 0; i < 50; i++) {
    const topic = TOPICS[i % TOPICS.length];
    // Append index to ensure uniqueness in title/slug
    const article = await generateArticle(`${topic} #${i + 1}`);
    results.push(article);
  }
  return results;
}
