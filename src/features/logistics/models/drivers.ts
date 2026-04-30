export type DriverBlock = "Aztlan" | "Felix U. Gomez" | "General Escobedo" | "Camino Real";

export interface ApiDriver {
  iId: number;
  sClave: string;
  sNombre: string;
  company: string;
  sSucursal: string;
  bActivo: boolean;
  sEstatus?: string;
  sUnidadAsignada?: string;
}

export interface Driver {
  id: string;
  name: string;
  block?: DriverBlock;
  assignedUnitId?: string;
  clave?: string;
  isActive?: boolean;
  company?: string;
  sucursal?: string;
  status?: string;
  apiAssignedUnit?: string;
  iIdUnit?: number;
}

export function mapApiDriverToDriver(apiDriver: ApiDriver): Driver {
  return {
    id: apiDriver.iId.toString(),
    name: apiDriver.sNombre.trim(),
    clave: apiDriver.sClave.trim(),
    isActive: apiDriver.bActivo,
    company: apiDriver.company,
    sucursal: apiDriver.sSucursal?.trim().toUpperCase() === "SIN SUCURSAL" ? "SANTA CATARINA" : apiDriver.sSucursal?.trim(),
    status: apiDriver.sEstatus,
    apiAssignedUnit: apiDriver.sUnidadAsignada,
  };
}
