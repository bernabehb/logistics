import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.deliverInvoices, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al marcar facturas como entregadas' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (deliver-invoices):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de entrega de facturas' },
      { status: 500 }
    );
  }
}
