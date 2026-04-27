import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const iIdDriver = searchParams.get('iIdDriver');
    
    let url = API_ENDPOINTS.routes;
    if (iIdDriver && iIdDriver !== 'all') {
      url += `?iIdDriver=${iIdDriver}`;
    }

    const response = await fetch(url, {
      headers: API_HEADERS,
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
