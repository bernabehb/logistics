import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceNum: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceNum = resolvedParams.invoiceNum;
    const response = await fetch(API_ENDPOINTS.invoiceDetails(invoiceNum), {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener detalles de la factura' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (invoice-details):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de detalles de factura' },
      { status: 500 }
    );
  }
}

