export type UnitStatus = "Disponible" | "Asignado" | "Mantenimiento" | "Fuera de Servicio";
export type UnitType = "Torthon" | "Rabon" | "Camioneta 3.5" | "Tractocamión" | "Unidad Ligera";

export interface Unit {
  id: string;
  name: string;
  plate: string;
  type: UnitType;
  status: UnitStatus;
  capacity: string;
  lastLocation: string;
  fuelLevel: number;
  mileage: number;
  sucursal?: string;
}

export interface ApiUnit {
  sNombre_Unidad: string;
  sSucursal: string;
  iCombustible: number;
}

export function mapApiUnitToUnit(apiUnit: ApiUnit, index: number): Unit {
  return {
    id: `unidad-api-${index}`,
    name: apiUnit.sNombre_Unidad.trim(),
    plate: "-", // No provisto por el API
    type: "Unidad Ligera", // Por defecto
    status: "Disponible", // Por defecto
    capacity: "5 Toneladas", // Por defecto
    lastLocation: "Sucursal " + apiUnit.sSucursal,
    fuelLevel: apiUnit.iCombustible,
    mileage: 0,
    sucursal: apiUnit.sSucursal.trim(),
  };
}

import unitsData from "@/lib/units.json";
export const MOCK_UNITS: Unit[] = unitsData as Unit[];

