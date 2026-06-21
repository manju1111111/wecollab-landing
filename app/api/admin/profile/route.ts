import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfileById, upsertProfile, uploadAvatar } from '@/lib/supabase/admin-profile';

/**
 * GET /api/admin/profile
 * Returns the authenticated user's profile.
 * 
 * Strategy (in priority order):
 * 1. Try to read from `public.profiles` table (permanent storage)
 * 2. Fall back to `auth.users.user_metadata` (works without profiles table)
 * 
 * This means the app works immediately, and upgrades seamlessly when
 * the profiles table is created in Supabase Dashboard.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to get from profiles table first
  let profileRow = null;
  let profilesTableExists = true;
  
  try {
    profileRow = await getProfileById(user.id);
  } catch (err: any) {
    // Table might not exist yet
    if (err.message?.includes('schema cache') || err.code === 'PGRST205') {
      profilesTableExists = false;
    }
  }

  // Build profile merging all sources (profiles table > user_metadata > defaults)
  const meta = user.user_metadata ?? {};
  const merged = {
    id: user.id,
    email: user.email ?? '',
    fullName: profileRow?.full_name ?? meta.full_name ?? meta.name ?? '',
    phone: profileRow?.phone ?? meta.phone ?? '',
    company: profileRow?.company ?? meta.company ?? '',
    role: profileRow?.role ?? meta.role ?? 'Admin',
    bio: profileRow?.bio ?? meta.bio ?? '',
    location: profileRow?.location ?? meta.location ?? '',
    avatarUrl: profileRow?.avatar_url ?? meta.avatar_url ?? '',
    updatedAt: profileRow?.updated_at ?? null,
    _storageMode: profilesTableExists ? 'database' : 'user_metadata',
  };

  return NextResponse.json({ profile: merged });
}

/**
 * PUT /api/admin/profile
 * Saves profile changes.
 * 
 * Strategy:
 * 1. Try to upsert into `public.profiles` table
 * 2. If that fails (table doesn't exist), save to `auth.users.user_metadata`
 * 
 * Both methods are permanent and survive logout/refresh/deployment.
 */
export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, phone, company, role, bio, location, avatarUrl } = body;

  let finalAvatarUrl = avatarUrl;
  let storageMode = 'database';

  // If it's a base64 image, try to upload to Supabase Storage
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    const { url, error: uploadError } = await uploadAvatar(user.id, avatarUrl);
    if (uploadError) {
      console.warn('[PUT /api/admin/profile] Avatar upload failed:', uploadError);
      // Keep base64 in user_metadata as fallback — it's ugly but functional
      finalAvatarUrl = avatarUrl;
    } else {
      finalAvatarUrl = url ?? avatarUrl;
    }
  }

  // Step 1: Try to save to profiles table
  let savedViaTable = false;
  try {
    const { success, error: dbError } = await upsertProfile(user.id, {
      full_name: fullName,
      phone,
      company,
      role,
      bio,
      location,
      ...(finalAvatarUrl && !finalAvatarUrl.startsWith('data:') ? { avatar_url: finalAvatarUrl } : {}),
    });
    savedViaTable = success;
    if (!success) {
      console.warn('[PUT /api/admin/profile] profiles table save failed:', dbError);
    }
  } catch (err: any) {
    console.warn('[PUT /api/admin/profile] profiles table not available:', err.message);
    savedViaTable = false;
  }

  // Step 2: Also/instead save to user_metadata (as permanent fallback)
  if (!savedViaTable) {
    storageMode = 'user_metadata';
    // Use admin client to update user metadata
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = await createAdminClient();
    
    const { error: metaError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: fullName,
        phone,
        company,
        role,
        bio,
        location,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      },
    });

    if (metaError) {
      console.error('[PUT /api/admin/profile] user_metadata save also failed:', metaError.message);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }
  }

  // Return the saved profile
  return NextResponse.json({
    success: true,
    storageMode,
    profile: {
      id: user.id,
      email: user.email ?? '',
      fullName: fullName ?? '',
      phone: phone ?? '',
      company: company ?? '',
      role: role ?? 'Admin',
      bio: bio ?? '',
      location: location ?? '',
      avatarUrl: finalAvatarUrl ?? '',
      updatedAt: new Date().toISOString(),
    }
  });
}
