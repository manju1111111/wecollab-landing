import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface AdminProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  updated_at: string | null;
}

export interface AdminProfileUpdate {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  role?: string;
  bio?: string;
  location?: string;
  updated_at?: string;
}

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Fetch the profile row for a given user ID.
 * Returns null if not found.
 */
export async function getProfileById(userId: string): Promise<AdminProfileRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // row not found (expected)
    // Propagate other errors (e.g. PGRST205 = table not found in schema cache)
    const err = new Error(error.message) as any;
    err.code = error.code;
    throw err;
  }
  return data as AdminProfileRow;
}

/**
 * Upsert a profile row. Creates or updates.
 */
export async function upsertProfile(
  userId: string,
  update: AdminProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, ...update, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('[upsertProfile] error:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Upload avatar to Supabase Storage and return the public URL.
 * Expects a base64 data URL or a File blob.
 */
export async function uploadAvatar(
  userId: string,
  base64DataUrl: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = getAdminClient();

  // Convert base64 to buffer
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return { url: null, error: 'Invalid image format' };
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const ext = mimeType.split('/')[1] || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error('[uploadAvatar] error:', uploadError.message);
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  // Bust cache with timestamp
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  return { url: publicUrl };
}
