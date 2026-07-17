import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.returnBranchPickupToRoutes, {
      method: 'POST',
      headers: await getResolvedServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Error al regresar la entrega de sucursal a Rutas', ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (return-branch-pickup-to-routes):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API para regresar a Rutas' },
      { status: 500 }
    );
  }
}