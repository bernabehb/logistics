export type DriverBlock = "Aztlan" | "Felix U. Gomez" | "General Escobedo" | "Camino Real";

export interface Driver {
  id: string;
  name: string;
  block: DriverBlock;
  assignedUnitId?: string;
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
