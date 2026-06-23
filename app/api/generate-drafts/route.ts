// app/api/generate-drafts/route.ts

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { insertNewsletter } from '@/lib/supabase/fallback-db';
import { generateFifty } from '@/lib/articles/generator';

export async function POST(request: Request) {
  try {
    // Optional: validate a secret token from headers/body for security
    const supabase = await createAdminClient();
    const articles = await generateFifty();
    const insertedIds: string[] = [];

    for (const article of articles) {
      // Ensure is_published false, created_at handled by insertNewsletter
      const { data, error } = await insertNewsletter(supabase, article);
      if (error) {
        console.error('Insert error for article', article.title, error);
        continue;
      }
      if (data && data.id) insertedIds.push(data.id);
    }

    return NextResponse.json({ success: true, inserted: insertedIds.length, ids: insertedIds });
  } catch (err: any) {
    console.error('Generate drafts error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}
