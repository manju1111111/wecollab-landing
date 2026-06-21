import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { signSession } from '@/lib/supabase/session-crypto';

function redirectToLogin(origin: string, message: string) {
  const url = new URL('/brand/login', origin);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

function redirectToDiscoverWithBrandSession(
  origin: string,
  sessionData: { id: string; name: string; role: 'brand' },
) {
  const response = NextResponse.redirect(new URL('/discover', origin));
  response.cookies.set('brand_session', signSession(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role');
  const providerError = searchParams.get('error_description') || searchParams.get('error');

  if (providerError) {
    return redirectToLogin(origin, providerError);
  }

  if (!code) {
    return redirectToLogin(origin, 'Missing authentication code. Please try signing in again.');
  }

  if (role !== 'brand') {
    return redirectToLogin(origin, 'Unsupported sign-in destination.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth exchange error:', error);
    return redirectToLogin(origin, error.message || 'Authentication failed.');
  }

  const user = data?.user;
  const email = user?.email?.toLowerCase();

  if (!user || !email) {
    return redirectToLogin(origin, 'Google did not return an email address for this account.');
  }

  const metadata = user.user_metadata || {};
  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.company_name ||
    email.split('@')[0] ||
    'OAuth Brand User';

  const adminSupabase = await createAdminClient();

  const { data: existingBrand, error: brandError } = await adminSupabase
    .from('brands')
    .select('id, name, status')
    .eq('email', email)
    .maybeSingle();
  let brand = existingBrand;

  if (brandError) {
    console.error('Callback select brand error:', brandError);
    return redirectToLogin(origin, 'Database query failed.');
  }

  if (!brand) {
    const { data: newBrand, error: insertError } = await adminSupabase
      .from('brands')
      .insert({
        name,
        email,
        status: 'active',
        industry: 'General',
        company_logo: metadata.avatar_url || null,
      })
      .select('id, name, status')
      .single();

    if (insertError) {
      console.error('Callback insert brand error:', insertError);
      return redirectToLogin(origin, 'Failed to register brand profile.');
    }

    brand = newBrand;
  }

  if (!brand) {
    return redirectToLogin(origin, 'Failed to resolve brand profile.');
  }

  if (brand.status !== 'active') {
    return redirectToLogin(origin, 'This brand account is inactive.');
  }

  return redirectToDiscoverWithBrandSession(origin, {
    id: brand.id,
    name: brand.name,
    role: 'brand',
  });
}
