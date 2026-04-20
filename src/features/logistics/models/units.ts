export type UnitStatus = "Disponible" | "Asignado" | "Mantenimiento" | "Fuera de Servicio";

export interface Unit {
  id: string;
  name: string;
  plate: string;
  type: string; // Permitir modelos dinámicos del backend
  status: UnitStatus;
  capacity: string;
  lastLocation: string;
  fuelLevel: number;
  mileage: number;
  sucursal?: string;
  latitud?: number;
  longitud?: number;
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
}

export function mapApiUnitToUnit(apiUnit: ApiUnit, index: number): Unit {
  return {
    id: `unidad-api-${index}`,
    name: apiUnit.sNombre_Unidad.trim(),
    plate: apiUnit.sPlaca.trim(),
    type: apiUnit.sModelo.trim(),
    status: "Disponible", // Por defecto al cargar
    capacity: "5 Toneladas", // Por defecto
    lastLocation: apiUnit.sUbicacion.trim(),
    fuelLevel: apiUnit.iCombustible,
    mileage: apiUnit.iKilometraje,
    sucursal: apiUnit.sSucursal.trim(),
    latitud: apiUnit.fLatitud,
    longitud: apiUnit.fLongitud,
  };
}

import unitsData from "@/lib/units.json";
export const MOCK_UNITS: Unit[] = unitsData as Unit[];

