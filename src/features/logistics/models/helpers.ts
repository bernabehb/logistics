export interface Helper {
  iIdHelper: number;
  sHelperName: string;
}

export interface AssignmentHelperPayload {
  iIdHelper?: number | null;
  sHelperName?: string | null;
  bHelperUsesOther: boolean;
}
