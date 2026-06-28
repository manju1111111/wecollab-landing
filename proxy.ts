import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
function decodeSessionCookie(signedCookie: string | undefined): any | null {
  if (!signedCookie) return null;
  const parts = signedCookie.split(".");
  if (parts.length !== 2) return null;
  const [base64Payload] = parts;
  try {
    const payloadStr = atob(base64Payload);
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Identify portal paths
  const isBrandPath = pathname.startsWith('/brand') || pathname === '/discover' || pathname.startsWith('/discover/');
  const isCreatorPath = pathname.startsWith('/creator');
  const isEmployeePath = pathname.startsWith('/employee');
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminApiPath = pathname.startsWith('/api/admin');

  // If not accessing any protected portals, proceed
  if (!isBrandPath && !isCreatorPath && !isEmployeePath && !isAdminPath && !isAdminApiPath) {
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
        let session = decodeSessionCookie(brandSession.value);
        if (!session) {
          try {
            session = JSON.parse(brandSession.value);
          } catch (_) {}
        }
        if (session && session.id && session.role?.toLowerCase() === 'brand') {
          isValid = true;
        }
      } catch (e) {
        // handle malformed session JSON
      }
    }

    if (isBrandLogin) {
      if (isValid) {
        return NextResponse.redirect(new URL('/discover', request.url));
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
        let session = decodeSessionCookie(creatorSession.value);
        if (!session) {
          try {
            session = JSON.parse(creatorSession.value);
          } catch (_) {}
        }
        if (session && session.id && session.role?.toLowerCase() === 'creator') {
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
        let session = decodeSessionCookie(employeeSession.value);
        if (!session) {
          try {
            session = JSON.parse(employeeSession.value);
          } catch (_) {}
        }
        const userRole = (session?.role || '').toLowerCase();
        const allowedRoles = ['employee', 'admin', 'manager', 'researcher', 'senior_employee', 'team_lead'];
        if (session && session.id && allowedRoles.includes(userRole)) {
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

  // 5. ADMIN API PORTAL PROTECTION
  if (isAdminApiPath) {
    const headerKey = request.headers.get('x-admin-key') || '';
    const cookieKey = request.cookies.get('WECO_ADMIN_KEY')?.value || '';
    const adminKey = process.env.ADMIN_API_KEY || '';

    // Check 1: Admin API Key (direct token authentication)
    if (adminKey && (headerKey === adminKey || cookieKey === adminKey)) {
      return NextResponse.next();
    }

    // Check 2: Native Supabase Auth (for admin dashboard browser requests)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Read-only in middleware
          },
          remove(name: string, options: CookieOptions) {
            // Read-only in middleware
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.next();
    }

    // Check 3: Employee Session (for employee portal browser requests)
    const employeeSession = request.cookies.get('employee_session');
    if (employeeSession?.value) {
      try {
        let session = decodeSessionCookie(employeeSession.value);
        if (!session) {
          try {
            session = JSON.parse(employeeSession.value);
          } catch (_) {}
        }
        const userRole = (session?.role || '').toLowerCase();
        const allowedRoles = ['employee', 'admin', 'manager', 'researcher', 'senior_employee', 'team_lead'];
        if (session && session.id && allowedRoles.includes(userRole)) {
          return NextResponse.next();
        }
      } catch (e) {
        // Ignore malformed session JSON
      }
    }

    // If none of the checks passed, reject
    return new NextResponse('Unauthorized: Invalid credentials or session expired', { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
