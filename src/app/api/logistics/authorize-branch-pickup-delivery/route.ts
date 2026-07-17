import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.authorizeBranchPickupDelivery, {
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
        { error: data?.message || data?.error || 'Error al autorizar recoleccion en sucursal', ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (authorize-branch-pickup-delivery):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de autorizacion de sucursal' },
      { status: 500 }
    );
  }
}