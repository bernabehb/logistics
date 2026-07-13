import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNum: string }> }
) {
  try {
    const { orderNum } = await params;
    const response = await fetch(API_ENDPOINTS.orderDetails(orderNum), {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener detalles de la orden de venta' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (order-details):', error);
    return NextResponse.json(
      { error: 'Error interno al obtener detalles de la orden de venta' },
      { status: 500 }
    );
  }
}