import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Properly configure the middleware to protect routes while allowing access to login
export default withAuth(
  // The middleware function - this runs for authenticated users
  function middleware(request: NextRequest) {
    // Allow unauthenticated access to the proxy endpoint used inside an iframe.
    // (withAuth otherwise rewrites it to /login which causes the infinite "Iniciando WebProxy..." state)
    if (request.nextUrl.pathname.startsWith('/api/webproxy')) {
      return NextResponse.next();
    }

    const { pathname, search } = request.nextUrl;
    const referer = request.headers.get('referer') || '';
    const isProxyContext = referer.includes('/webproxy') || referer.includes('/api/webproxy');

    if (isProxyContext && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname !== '/favicon.ico') {
      const shouldProxy = /\.(?:html?|js|css|map|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(pathname);

      if (shouldProxy) {
        const targetUrl = `https://web.whatsapp.com${pathname}${search}`;
        const proxyUrl = request.nextUrl.clone();
        proxyUrl.pathname = '/api/webproxy';
        proxyUrl.search = `url=${encodeURIComponent(targetUrl)}`;
        return NextResponse.rewrite(proxyUrl);
      }
    }

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
    // Also exclude /api/webproxy, /browsers.html and /hype-console.js so the iframe can load without auth redirects.
    '/((?!login|api/auth|api/webproxy|browsers\.html|hype-console\.js|wppconnect-wa\.js|_next/static|_next/image|favicon.ico).*)',
  ],
};
