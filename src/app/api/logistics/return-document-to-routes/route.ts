import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.returnDocumentToRoutes, {
      method: 'POST',
      headers: await getServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Error al regresar el documento a Rutas', ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (return-document-to-routes):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API para regresar el documento a Rutas' },
      { status: 500 }
    );
  }
}
