import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.markScannedInvoicesInRouteManual, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: 'Error al mandar facturas escaneadas en ruta' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (mark-scanned-invoices-in-route-manual):', error);
    return NextResponse.json(
      { error: 'Error interno al mandar facturas escaneadas en ruta' },
      { status: 500 }
    );
  }
}
