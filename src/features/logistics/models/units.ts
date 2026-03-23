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
  fuelLevel: number; // Percentage
  mileage: number;
}

export const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Unidad 1", plate: "ABC-1234", type: "Torthon", status: "Asignado", capacity: "5 TONELADAS", lastLocation: "Santa Catarina, NL", fuelLevel: 85, mileage: 45200 },
  { id: "u2", name: "Unidad 2", plate: "XYZ-5678", type: "Rabon", status: "Asignado", capacity: "3 TONELADAS", lastLocation: "San Pedro Garza García, NL", fuelLevel: 42, mileage: 32100 },
  { id: "u3", name: "Unidad 3", plate: "GHI-9012", type: "Torthon", status: "Disponible", capacity: "5 TONELADAS", lastLocation: "Apodaca, NL", fuelLevel: 95, mileage: 12500 },
  { id: "u4", name: "Unidad 4", plate: "JKL-3456", type: "Torthon", status: "Mantenimiento", capacity: "5 TONELADAS", lastLocation: "Taller Mecánico Central", fuelLevel: 15, mileage: 89000 },
  { id: "u5", name: "Unidad 5", plate: "MNO-7890", type: "Tractocamión", status: "Disponible", capacity: "5 TONELADAS", lastLocation: "Cedis Norte", fuelLevel: 78, mileage: 156000 },
  { id: "u6", name: "Unidad 6", plate: "PQR-1122", type: "Rabon", status: "Disponible", capacity: "3 TONELADAS", lastLocation: "Patio Lincoln", fuelLevel: 60, mileage: 45000 },
  { id: "u7", name: "Unidad 7", plate: "STU-3344", type: "Torthon", status: "Asignado", capacity: "5 TONELADAS", lastLocation: "Escobedo, NL", fuelLevel: 30, mileage: 67000 },
  { id: "u8", name: "Unidad 8", plate: "VWX-5566", type: "Rabon", status: "Disponible", capacity: "3 TONELADAS", lastLocation: "Cadereyta, NL", fuelLevel: 88, mileage: 23100 },
  { id: "u9", name: "Unidad 9", plate: "YZA-7788", type: "Tractocamión", status: "Asignado", capacity: "5 TONELADAS", lastLocation: "Saltillo, Coah", fuelLevel: 55, mileage: 120500 },
  { id: "u10", name: "Unidad 10", plate: "BCD-9900", type: "Torthon", status: "Mantenimiento", capacity: "5 TONELADAS", lastLocation: "Taller Central", fuelLevel: 10, mileage: 98400 },
  { id: "u11", name: "Unidad 11", plate: "EFG-1133", type: "Unidad Ligera", status: "Disponible", capacity: "1 TONELADA", lastLocation: "Patio Poniente", fuelLevel: 72, mileage: 54200 },
  { id: "u12", name: "Unidad 12", plate: "HIJ-2244", type: "Unidad Ligera", status: "Asignado", capacity: "1 TONELADA", lastLocation: "Laredo, Tx", fuelLevel: 65, mileage: 210000 },
  { id: "u13", name: "Unidad 13", plate: "KLM-3355", type: "Unidad Ligera", status: "Disponible", capacity: "1 TONELADA", lastLocation: "S.N.G, NL", fuelLevel: 90, mileage: 34100 },
  { id: "u14", name: "Unidad 14", plate: "NOP-4466", type: "Rabon", status: "Asignado", capacity: "3 TONELADAS", lastLocation: "Monterrey, NL", fuelLevel: 48, mileage: 78200 },
  { id: "u15", name: "Unidad 15", plate: "QRS-5577", type: "Torthon", status: "Disponible", capacity: "5 TONELADAS", lastLocation: "Guadalupe, NL", fuelLevel: 82, mileage: 12900 },
];
