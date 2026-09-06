import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

const adminOnlyRoutes = ['/master-voa', '/settings', '/users', '/audit-logs'];
const protectedRoutes = ['/dashboard', '/transactions', '/reports', ...adminOnlyRoutes];
const publicRoutes = ['/login', '/'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get('session')?.value;
  let session = null;

  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      // invalid token
    }
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect to dashboard if accessing login while already authenticated
  if (isPublicRoute && session && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Block PETUGAS from accessing admin only routes
  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
