export type BlockStatus = "Disponible" | "Asignado";

export interface Block {
  id: string;
  iId: number;
  logisticsBranchId?: number;
  logisticsBranch?: string;
  name: string;
  status: BlockStatus;
  apiDriverName?: string;
  iIdUnit?: number;
}
