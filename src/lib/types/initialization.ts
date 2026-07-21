export type InitializationStatus = {
  initialized: boolean;
  groupCount: number;
  datasetCount: number;
};

export type InitializationResult = InitializationStatus & {
  skipped: boolean;
};

export type PowerBiSyncResult = InitializationStatus & {
  groupsAdded: number;
  datasetsAdded: number;
};

export type InitializationStatusResponse =
  | ({ ok: true } & InitializationStatus)
  | { ok: false; message: string };
