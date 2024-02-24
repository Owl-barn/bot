import { CommandEventKey } from "./events";

export interface BaseMessage<T = any> {
  mid: string;
  command: CommandEventKey;
  data: T & { error?: string };
}

export interface AuthResponse {
  token: string;
}
