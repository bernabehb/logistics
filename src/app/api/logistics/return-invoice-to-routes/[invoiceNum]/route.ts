import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invoiceNum: string }> }
) {
  try {
    const { invoiceNum } = await params;
    const response = await fetch(API_ENDPOINTS.returnInvoiceToRoutes(invoiceNum), {
      method: 'POST',
      headers: await getResolvedServerApiHeaders(),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Error al regresar la factura a Rutas', ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (return-invoice-to-routes):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API para regresar la factura a Rutas' },
      { status: 500 }
    );
  }
}