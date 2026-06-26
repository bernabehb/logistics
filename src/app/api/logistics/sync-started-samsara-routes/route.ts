import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST() {
  try {
    const response = await fetch(API_ENDPOINTS.syncStartedSamsaraRoutes, {
      method: 'POST',
      headers: API_HEADERS,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error (sync-started-samsara-routes):', response.status, errorText);
      return NextResponse.json(
        { error: 'Error al sincronizar rutas iniciadas desde Samsara' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (sync-started-samsara-routes):', error);
    return NextResponse.json(
      { error: 'Error interno al sincronizar rutas iniciadas desde Samsara' },
      { status: 500 }
    );
  }
}
