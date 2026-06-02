import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Identify portal paths
  const isBrandPath = pathname.startsWith('/brand');
  const isCreatorPath = pathname.startsWith('/creator');
  const isEmployeePath = pathname.startsWith('/employee');
  const isAdminPath = pathname.startsWith('/admin');

  // If not accessing any protected portals, proceed
  if (!isBrandPath && !isCreatorPath && !isEmployeePath && !isAdminPath) {
    return NextResponse.next();
  }

  // Define login and public onboarding endpoints to prevent redirect loops
  const isBrandLogin = pathname === '/brand/login';
  const isCreatorLogin = pathname === '/creator/login' || pathname === '/creator/onboard';
  const isEmployeeLogin = pathname === '/employee/login' || pathname === '/employee/create-account';
  const isAdminLogin = pathname === '/admin/login';

  // 1. BRAND PORTAL PROTECTION
  if (isBrandPath) {
    const brandSession = request.cookies.get('brand_session');
    
    let isValid = false;
    if (brandSession?.value) {
      try {
        const session = JSON.parse(brandSession.value);
        if (session && session.id && session.role === 'brand') {
          isValid = true;
        }
      } catch (e) {
        // handle malformed session JSON
      }
    }

    if (isBrandLogin) {
      if (isValid) {
        return NextResponse.redirect(new URL('/brand', request.url));
      }
      return NextResponse.next();
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/brand/login', request.url));
    }
  }

  // 2. CREATOR PORTAL PROTECTION
  if (isCreatorPath) {
    const creatorSession = request.cookies.get('creator_session');
    
    let isValid = false;
    if (creatorSession?.value) {
      try {
        const session = JSON.parse(creatorSession.value);
        if (session && session.id && session.role === 'creator') {
          isValid = true;
        }
      } catch (e) {
        // handle malformed session JSON
      }
    }

    if (isCreatorLogin) {
      if (isValid && pathname === '/creator/login') {
        return NextResponse.redirect(new URL('/creator', request.url));
      }
      return NextResponse.next();
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/creator/login', request.url));
    }
  }

  // 3. EMPLOYEE PORTAL PROTECTION
  if (isEmployeePath) {
    const employeeSession = request.cookies.get('employee_session');
    
    let isValid = false;
    if (employeeSession?.value) {
      try {
        const session = JSON.parse(employeeSession.value);
        if (session && session.id && (session.role === 'employee' || session.role === 'admin' || session.role === 'senior_employee' || session.role === 'team_lead')) {
          isValid = true;
        }
      } catch (e) {
        // handle malformed session JSON
      }
    }

    if (isEmployeeLogin) {
      if (isValid && pathname === '/employee/login') {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
      return NextResponse.next();
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/employee/login', request.url));
    }
  }

  // 4. ADMIN PORTAL PROTECTION (NATIVE SUPABASE AUTH)
  if (isAdminPath) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    );

    // Get active session user to guarantee it's authentic and un-tampered
    const { data: { user } } = await supabase.auth.getUser();
    const isUserAuthenticated = !!user;

    if (isAdminLogin) {
      if (isUserAuthenticated) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return response;
    }

    if (!isUserAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
