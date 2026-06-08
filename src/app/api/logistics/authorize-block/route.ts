import { NextResponse } from 'next/server';
import { API_ENDPOINTS, API_HEADERS } from '@/lib/apiConfig';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.authorizeBlock, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Error del servidor externo: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (authorize-block):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar procesar la autorización del bloque' },
      { status: 500 }
    );
  }
}
