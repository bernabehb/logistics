import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    const includePreviousPending = searchParams.get('includePreviousPending');
    const previousPendingDays = searchParams.get('previousPendingDays');

    if (includePreviousPending === 'true') {
      params.set('includePreviousPending', 'true');
      if (previousPendingDays) {
        params.set('previousPendingDays', previousPendingDays);
      }
    }

    const query = params.toString();
    const url = query ? `${API_ENDPOINTS.blocksStatus}?${query}` : API_ENDPOINTS.blocksStatus;

    const response = await fetch(url, {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener los bloques desde el servidor externo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Proxy error (blocks-status):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar conectar con la API de bloques' },
      { status: 500 }
    );
  }
}

