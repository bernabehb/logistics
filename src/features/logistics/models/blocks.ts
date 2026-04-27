export type BlockStatus = "Disponible" | "Asignado";

export interface Block {
  id: string;
  iId: number;
  name: string;
  status: BlockStatus;
  apiDriverName?: string;
  iIdUnit?: number;
}
