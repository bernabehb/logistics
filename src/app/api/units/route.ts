import { NextResponse } from 'next/server';

export async function GET() {
  const EXTERNAL_API_URL = 'https://ds29pw03-7297.usw3.devtunnels.ms/Logistics/GetUnits';

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      headers: {
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 } // Disable caching to get fresh data
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener las unidades desde el servidor externo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error (units):', error);
    return NextResponse.json(
      { error: 'Error interno al intentar conectar con la API de unidades' },
      { status: 500 }
    );
  }
}
