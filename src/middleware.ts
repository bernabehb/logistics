import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtExpired(token?: string) {
  if (!token) return false;

  const [, payload] = token.split('.');
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    const expiresAt = typeof decoded?.exp === 'number' ? decoded.exp * 1000 : null;
    return Boolean(expiresAt && Date.now() >= expiresAt);
  } catch {
    return false;
  }
}

function clearExpiredSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const response = path.startsWith('/api')
    ? NextResponse.json(
        { error: 'Sesion expirada. Inicia sesion nuevamente.', sessionExpired: true },
        { status: 401 }
      )
    : NextResponse.redirect(new URL('/login?session=expired', request.url));

  response.cookies.delete('auth_token');
  return response;
}

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;
  const isApiPath = path.startsWith('/api');

  // Protect all main application routes and local API proxy routes.
  const isProtectedPagePath = path.startsWith('/logistics');

  if (!authToken && isApiPath) {
    return NextResponse.json(
      { error: 'Sesion no encontrada. Inicia sesion nuevamente.', sessionExpired: true },
      { status: 401 }
    );
  }

  // If not logged in and accessing protected route, send to /login.
  if (!authToken && isProtectedPagePath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and hitting login page or root, redirect to specific role dashboard.
  if (authToken) {
    try {
      const session = JSON.parse(authToken);
      const isLegacyLogisticsSession = session.role === 'Logistica' && !session.backendToken;

      if (isLegacyLogisticsSession || isJwtExpired(session.backendToken)) {
        return clearExpiredSession(request);
      }

      if (isApiPath) {
        return NextResponse.next();
      }
      
      if (path === '/login' || path === '/') {
        if (session.role === 'Guardia') {
          return NextResponse.redirect(new URL('/logistics/autorizar-salida', request.url));
        } else {
          return NextResponse.redirect(new URL('/logistics/rutas', request.url));
        }
      }

      // Verify Role vs Path.
      if (session.role === 'Logistica' && path === '/logistics') {
        return NextResponse.redirect(new URL('/logistics/rutas', request.url));
      }

      if (session.role === 'Guardia' && (path === '/logistics' || (path.startsWith('/logistics') && path !== '/logistics/autorizar-salida'))) {
        return NextResponse.redirect(new URL('/logistics/autorizar-salida', request.url));
      }

    } catch {
      // In case of invalid token format, clear and send to login.
      return clearExpiredSession(request);
    }
  }

  // Root path for unauthenticated users.
  if (path === '/' && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
