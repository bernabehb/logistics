export type DriverBlock = "Aztlan" | "Felix U. Gomez" | "General Escobedo" | "Camino Real";

export interface Driver {
  id: string;
  name: string;
  block: DriverBlock;
}

export const MOCK_DRIVERS: Driver[] = [
  // Aztlan
  { id: "d1", name: "Juan Pérez", block: "Aztlan" },
  { id: "d2", name: "Carlos López", block: "Aztlan" },
  { id: "d3", name: "Miguel Sánchez", block: "Aztlan" },
  // Felix U. Gomez
  { id: "d4", name: "Mario Garza", block: "Felix U. Gomez" },
  { id: "d5", name: "Roberto Torres", block: "Felix U. Gomez" },
  // General Escobedo
  { id: "d6", name: "Luis Ramírez", block: "General Escobedo" },
  { id: "d7", name: "Pedro Méndez", block: "General Escobedo" },
  { id: "d8", name: "Andrés Silva", block: "General Escobedo" },
  // Camino Real
  { id: "d9", name: "Javier Flores", block: "Camino Real" },
  { id: "d10", name: "Ricardo Ortiz", block: "Camino Real" },
];
