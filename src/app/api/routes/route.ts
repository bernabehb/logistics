import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const iIdDriver = searchParams.get('iIdDriver');
    const includePreviousPending = searchParams.get('includePreviousPending');
    const previousPendingDays = searchParams.get('previousPendingDays');
    const iIdBranch = searchParams.get('iIdBranch');

    const params = new URLSearchParams();
    if (iIdDriver && iIdDriver !== 'all') {
      params.set('iIdDriver', iIdDriver);
    }
    if (iIdBranch && iIdBranch !== 'all') {
      params.set('iIdBranch', iIdBranch);
    }
    if (includePreviousPending === 'true') {
      params.set('includePreviousPending', 'true');
      if (previousPendingDays) {
        params.set('previousPendingDays', previousPendingDays);
      }
    }

    const query = params.toString();
    const url = query ? `${API_ENDPOINTS.routes}?${query}` : API_ENDPOINTS.routes;

    const response = await fetch(url, {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener las rutas desde el servidor externo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (routes):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar conectar con la API de rutas' },
      { status: 500 }
    );
  }
}

