import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { iIdUnit, bMaintenance } = body;

    const response = await fetch(API_ENDPOINTS.toggleUnitMaintenance, {
      method: 'POST',
      headers: await getServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ iIdUnit, bMaintenance }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: errText || 'Error al cambiar el estado de mantenimiento' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (toggleUnitMaintenance):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar conectar con la API de mantenimiento' },
      { status: 500 }
    );
  }
}


