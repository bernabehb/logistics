import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceNum: string }> }
) {
  try {
    const { invoiceNum } = await params;

    const response = await fetch(API_ENDPOINTS.scanInvoiceForDeparture(invoiceNum), {
      method: 'POST',
      headers: API_HEADERS,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error (scan-invoice-for-departure):', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to scan invoice for departure' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (scan-invoice-for-departure):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
