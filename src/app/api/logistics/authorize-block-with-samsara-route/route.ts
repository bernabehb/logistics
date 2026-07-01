import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getResolvedServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(API_ENDPOINTS.authorizeBlockWithSamsaraRoute, {
      method: 'POST',
      headers: await getResolvedServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMessage = 'Error del servidor externo';
      try {
        const errJson = await response.json();
        errorMessage = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (authorize-block-with-samsara-route):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar autorizar el bloque y sincronizar la ruta en Samsara' },
      { status: 500 }
    );
  }
}

