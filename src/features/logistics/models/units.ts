export type UnitStatus = "Disponible" | "Asignado" | "Mantenimiento" | "Fuera de Servicio";

export interface Unit {
  id: string;
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
  const apiStatus = apiUnit.sEstatus?.trim();
  
  if (apiStatus === "Asignado") status = "Asignado";
  else if (apiStatus === "En Taller" || apiStatus === "Mantenimiento") status = "Mantenimiento";
  else if (apiStatus === "Fuera de Servicio") status = "Fuera de Servicio";

  return {
    id: `unidad-api-${index}`,
    name: apiUnit.sNombre_Unidad.trim(),
    plate: apiUnit.sPlaca.trim(),
    type: apiUnit.sModelo.trim(),
    status: status,
    capacity: "5 Toneladas",
    lastLocation: apiUnit.sUbicacion.trim(),
    fuelLevel: apiUnit.iCombustible,
    mileage: apiUnit.iKilometraje,
    sucursal: apiUnit.sSucursal.trim(),
    latitud: apiUnit.fLatitud,
    longitud: apiUnit.fLongitud,
    apiDriverName: apiUnit.sChofer?.trim() || undefined,
  };
}

import unitsData from "@/lib/units.json";
export const MOCK_UNITS: Unit[] = unitsData as Unit[];

