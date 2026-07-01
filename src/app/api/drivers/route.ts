import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET() {
  try {
    const response = await fetch(API_ENDPOINTS.drivers, {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 } // Disable caching to get fresh data
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener los choferes desde el servidor externo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (drivers):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar conectar con la API de choferes' },
      { status: 500 }
    );
  }
}

