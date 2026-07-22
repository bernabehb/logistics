import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { getServerApiHeaders } from '@/lib/serverApiHeaders';

export async function GET() {
  try {
    const response = await fetch(API_ENDPOINTS.materialReviewDocumentStatus, {
      headers: await getServerApiHeaders(),
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: 'Error al obtener el estado del documento automatico', detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (material-review-document-status):', error);
    return NextResponse.json(
      { error: 'Error interno al conectar con la API de estado del documento automatico' },
      { status: 500 }
    );
  }
}