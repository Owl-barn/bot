import { Guild } from "./commands/status";

export interface Credentials {
  id: string;
  token: string;
}

export interface baseMessage<T extends baseData = baseData> {
  mid: string;
  command: string;
  data: T & baseData;
}

export interface baseData {
  error?: string;
  exception?: string;
}

export interface Authenticate extends baseData {
  token?: string;
  password: string;
}

export interface Status extends baseData {
  id: string;
  status: string;
  guilds: Guild[];
}
