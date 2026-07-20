export type PowerBiGroup = {
  id: string;
  name: string;
  type: string;
  isReadOnly: boolean;
  isOnDedicatedCapacity: boolean;
};

export type PowerBiDataset = {
  id: string;
  name: string;
  webUrl?: string;
  addRowsAPIEnabled?: boolean;
  configuredBy?: string;
  isRefreshable?: boolean;
  isEffectiveIdentityRequired?: boolean;
  isEffectiveIdentityRolesRequired?: boolean;
  isOnPremGatewayRequired?: boolean;
  targetStorageMode?: string;
  createdDate?: string;
};

export type AmsaPowerBiTokenResponse = {
  statusCode?: number;
  message?: string;
  detailedMessage?: string;
  token?: string;
  token_data?: string;
};
