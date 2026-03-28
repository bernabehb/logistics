import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Protect all main application routes
  const isProtectedPath = path.startsWith('/logistics') || path.startsWith('/chofer') || path.startsWith('/cajas') || path.startsWith('/admin');

  // If not logged in and accessing protected route, send to /login
  if (!authToken && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and hitting login page or root, redirect to specific role dashboard
  if (authToken) {
    try {
      const session = JSON.parse(authToken);
      
      if (path === '/login' || path === '/') {
        if (session.role === 'Chofer') {
          return NextResponse.redirect(new URL('/chofer', request.url));
        } else if (session.role === 'Guardia') {
          return NextResponse.redirect(new URL('/logistics/autorizar-salida', request.url));
        } else if (session.role === 'Cajas') {
          return NextResponse.redirect(new URL('/cajas', request.url));
        } else if (session.role === 'Admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/logistics', request.url));
        }
      }

      // Verify Role vs Path
      if (session.role === 'Chofer' && path.startsWith('/logistics')) {
        return NextResponse.redirect(new URL('/chofer', request.url));
      }
      
      if (session.role === 'Logistica' && (path.startsWith('/chofer') || path.startsWith('/cajas'))) {
        return NextResponse.redirect(new URL('/logistics', request.url));
      }

      if (session.role === 'Guardia' && (path === '/logistics' || (path.startsWith('/logistics') && path !== '/logistics/autorizar-salida') || path.startsWith('/cajas'))) {
        return NextResponse.redirect(new URL('/logistics/autorizar-salida', request.url));
      }

      if (session.role === 'Cajas' && (path.startsWith('/logistics') || path.startsWith('/chofer'))) {
        return NextResponse.redirect(new URL('/cajas', request.url));
      }

      if (session.role === 'Admin' && !path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      if (session.role !== 'Admin' && path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

    } catch (e) {
      // In case of invalid token format, clear and send to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Root path for unauthenticated users
  if (path === '/' && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
