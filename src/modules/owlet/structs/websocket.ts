export interface Credentials {
  id: string;
  token: string;
}

export interface wsRequest {
  mid: string;
  command: string;
  data: Record<string, unknown>;
}

export interface wsResponse {
  [key: string]: unknown;
  error?: string;
}
