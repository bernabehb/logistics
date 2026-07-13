import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNum: string }> }
) {
  try {
    const { orderNum } = await params;

    const response = await fetch(API_ENDPOINTS.scanOrderForDeparture(orderNum), {
      method: 'POST',
      headers: await getResolvedServerApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error (scan-order-for-departure):', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to scan order for departure' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (scan-order-for-departure):', error);
    return NextResponse.json(
      { error: 'Error interno al escanear orden de venta' },
      { status: 500 }
    );
  }
}