import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get token from request cookies instead of using authService
  const token = request.cookies.get('token')?.value;
  const tokenExpiry = request.cookies.get('token_expiry')?.value;
  const role = request.cookies.get('userRole')?.value;

  // Check token validity
  const isValid = (() => {
    if (!token || !tokenExpiry) return false;
    try {
      const expiryTime = new Date(tokenExpiry).getTime();
      const currentTime = Date.now();
      return expiryTime > currentTime;
    } catch (error) {
      return false;
    }
  })();

  if (!isValid) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/store-dashboard') && role !== 'storemanager' && role !== 'storeadmin' && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/admin-dashboard') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/store-dashboard/:path*', '/admin-dashboard/:path*'],
};