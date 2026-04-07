export type DriverBlock = "Aztlan" | "Felix U. Gomez" | "General Escobedo" | "Camino Real";

export interface ApiDriver {
  iId: number;
  sClave: string;
  sNombre: string;
  company: string;
  bActivo: boolean;
}

export interface Driver {
  id: string;
  name: string;
  block?: DriverBlock;
  assignedUnitId?: string;
  clave?: string;
  isActive?: boolean;
  company?: string;
}

export function mapApiDriverToDriver(apiDriver: ApiDriver): Driver {
  return {
    id: apiDriver.iId.toString(),
    name: apiDriver.sNombre.trim(),
    clave: apiDriver.sClave.trim(),
    isActive: apiDriver.bActivo,
    company: apiDriver.company,
    // Default block for compatibility if needed, or leave undefined
  };
}

export const MOCK_DRIVERS: Driver[] = [
  // Aztlan
  { id: "d1", name: "Juan Pérez", block: "Aztlan", assignedUnitId: "u12" },
  { id: "d2", name: "Carlos López", block: "Aztlan" },
  { id: "d3", name: "Miguel Sánchez", block: "Aztlan", assignedUnitId: "u14" },
  // Felix U. Gomez
  { id: "d4", name: "Mario Garza", block: "Felix U. Gomez", assignedUnitId: "u2" },
  { id: "d5", name: "Roberto Torres", block: "Felix U. Gomez" },
  // General Escobedo
  { id: "d6", name: "Luis Ramírez", block: "General Escobedo", assignedUnitId: "u7" },
  { id: "d7", name: "Pedro Méndez", block: "General Escobedo" },
  { id: "d8", name: "Andrés Silva", block: "General Escobedo", assignedUnitId: "u9" },
  // Camino Real
  { id: "d9", name: "Javier Flores", block: "Camino Real" },
  { id: "d10", name: "Ricardo Ortiz", block: "Camino Real", assignedUnitId: "u1" },
];
