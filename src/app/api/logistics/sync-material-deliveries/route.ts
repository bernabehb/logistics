import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({ daysBack: 1, invoiceNums: [] }));
    const response = await fetch(API_ENDPOINTS.syncMaterialDeliveriesFromSamsara, {
      method: 'POST',
      headers: await getServerApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { error: 'Error al sincronizar entregas desde Samsara' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (sync-material-deliveries):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de sincronizacion de entregas' },
      { status: 500 }
    );
  }
}