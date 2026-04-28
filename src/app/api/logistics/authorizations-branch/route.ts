import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function GET() {
  try {
    const response = await fetch(API_ENDPOINTS.authorizationsBranch, {
      headers: API_HEADERS,
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener autorizaciones de sucursal' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (authorizations-branch):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de autorizaciones (sucursal)' },
      { status: 500 }
    );
  }
}
