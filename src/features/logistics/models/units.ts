export type UnitStatus = "Disponible" | "Asignado" | "Mantenimiento";

export interface Unit {
  id: string;
  iId: number; // ID numérico para peticiones del backend
  name: string;
  plate: string;
  type: string;
  status: UnitStatus;
  capacity: string;
  lastLocation: string;
  fuelLevel: number;
  mileage: number;
  sucursal?: string;
  latitud?: number;
  longitud?: number;
  apiDriverName?: string; // Nombre del chofer que viene del backend
}

export interface ApiUnit {
  sId?: string;
  iId?: number;
  iIdUnit?: number;
  sNombre_Unidad: string;
  sSucursal: string;
  iCombustible: number;
  sModelo: string;
  sPlaca: string;
  iKilometraje: number;
  sUbicacion: string;
  fLatitud: number;
  fLongitud: number;
  sEstatus: string; // "Disponible", "Asignado", "En Taller", etc.
  sChofer: string;
}

export function mapApiUnitToUnit(apiUnit: ApiUnit, index: number): Unit {
  // Normalizar el estado del backend a nuestro UnitStatus
  let status: UnitStatus = "Disponible";
  const apiStatus = apiUnit.sEstatus?.trim().toLowerCase();
  
  if (apiStatus === "asignado") status = "Asignado";
  else if (apiStatus === "en taller" || apiStatus === "mantenimiento" || apiStatus === "fuera de servicio" || apiStatus === "taller") status = "Mantenimiento";

  return {
    id: `unidad-api-${index}`,
    iId: Number(apiUnit.sId || apiUnit.iId || apiUnit.iIdUnit || index),
    name: apiUnit.sNombre_Unidad.trim(),
    plate: apiUnit.sPlaca.trim(),
    type: apiUnit.sModelo.trim(),
    status: status,
    capacity: "5 Toneladas",
    lastLocation: apiUnit.sUbicacion.trim(),
    fuelLevel: apiUnit.iCombustible,
    mileage: apiUnit.iKilometraje,
    sucursal: apiUnit.sSucursal?.trim().toUpperCase() === "SIN SUCURSAL" ? "SANTA CATARINA" : apiUnit.sSucursal?.trim(),
    latitud: apiUnit.fLatitud,
    longitud: apiUnit.fLongitud,
    apiDriverName: apiUnit.sChofer?.trim() || undefined,
  };
}

import unitsData from "@/lib/units.json";
// Ensure mock units have numeric iId
export const MOCK_UNITS: Unit[] = (unitsData as any[]).map((u, index) => ({
  ...u,
  iId: u.iId || index + 1
}));

