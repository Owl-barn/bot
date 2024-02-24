export interface Arguments { }

export interface Response {
  id: string;
  uptime: number;
  guilds: Guild[];
}

export interface Guild {
  id: string;
  channelId?: string;
}
