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
}

import unitsData from "@/lib/units.json";
export const MOCK_UNITS: Unit[] = unitsData as Unit[];

