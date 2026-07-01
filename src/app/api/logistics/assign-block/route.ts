import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.assignBlock, {
      method: 'POST',
      headers: await getResolvedServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al asignar el bloque en el servidor externo' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Proxy error (assign-block):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar procesar la asignación' },
      { status: 500 }
    );
  }
}

