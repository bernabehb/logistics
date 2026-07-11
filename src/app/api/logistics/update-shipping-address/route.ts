import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.updateShippingAddress, {
      method: 'POST',
      headers: await getResolvedServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Error al actualizar la direccion de envio' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (update-shipping-address):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de cambio de direccion de envio' },
      { status: 500 }
    );
  }
}
