import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Properly configure the middleware to protect routes while allowing access to login
export default withAuth(
  // The middleware function - this runs for authenticated users
  function middleware(request: NextRequest) {
    return NextResponse.next();
  },
  {
    // Specify the login page
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (public route)
     * - api/auth (public auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
