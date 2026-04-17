/**
 * Configuración centralizada para la API externa.
 * Evita inconsistencias de URLs entre diferentes archivos.
 */

// Usamos la URL del Túnel activa reportada en los logs de error
export const EXTERNAL_API_BASE_URL = 'https://5xtsg3k1-7297.usw3.devtunnels.ms';

export const API_HEADERS = {
  'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
  'Accept': 'application/json',
};

export const API_ENDPOINTS = {
  routes: `${EXTERNAL_API_BASE_URL}/Logistics/GetRoutesInvoices`,
  units: `${EXTERNAL_API_BASE_URL}/Logistics/GetUnits`,
  drivers: `${EXTERNAL_API_BASE_URL}/Logistics/GetDrivers`,
};
