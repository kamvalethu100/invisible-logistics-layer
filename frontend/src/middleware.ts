import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Handle regional subdomains
  let region = 'all';
  if (hostname.startsWith('jhb.')) {
    region = 'jhb';
  } else if (hostname.startsWith('nairobi.')) {
    region = 'nairobi';
  }

  // Set the region in a header so the app can use it
  const response = NextResponse.next();
  response.headers.set('x-logistiqs-region', region);
  
  // Also set a cookie for client-side persistence if needed
  if (region !== 'all') {
    response.cookies.set('logistiqs-region', region, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
