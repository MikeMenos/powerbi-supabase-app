import type { InitializationResult } from "@/types/initialization";

export type Nullable<T> = T | null;

export type ApiUserInfo = {
  userID: number;
  userUID?: Nullable<string>;
  username?: Nullable<string>;
  fname?: Nullable<string>;
  lname?: Nullable<string>;
  area?: Nullable<string>;
  team?: Nullable<string>;
  isSuperAdmin: boolean;
  isSalesAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  sellerCode?: Nullable<string>;
  travmaArea?: Nullable<string>;
  travmaTeam?: Nullable<string>;
};

export type SessionUserInfo = Pick<
  ApiUserInfo,
  | "userID"
  | "userUID"
  | "username"
  | "fname"
  | "lname"
  | "area"
  | "team"
  | "isSuperAdmin"
  | "isSalesAdmin"
  | "isSeller"
  | "isManager"
  | "sellerCode"
  | "travmaArea"
  | "travmaTeam"
>;

export type LoginResponse = {
  statusCode?: Nullable<number>;
  message?: Nullable<string>;
  detailedMessage?: Nullable<string>;
  accessToken?: Nullable<string>;
  tokenType?: Nullable<string>;
  expiresIn?: Nullable<number>;
  userInfos?: Nullable<ApiUserInfo>;
  warningMessage?: Nullable<string>;
};

export type LoginSuccess = LoginResponse & {
  ok: true;
  initialization: InitializationResult;
};

export type AuthMeSuccess = {
  ok: true;
  authenticated: boolean;
  userInfos?: SessionUserInfo | null;
  user?: { username?: string };
};

export type ApiFailure = {
  ok: false;
  message: string;
};

export type LoginApiResponse = LoginSuccess | ApiFailure;
export type AuthMeResponse = AuthMeSuccess | ApiFailure;
