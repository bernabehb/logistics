import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceNum: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceNum = resolvedParams.invoiceNum;
    const response = await fetch(API_ENDPOINTS.authorizeInvoice(invoiceNum), {
      method: 'POST',
      headers: API_HEADERS,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al autorizar la factura' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (authorize-invoice):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de autorización de factura' },
      { status: 500 }
    );
  }
}
