import { loopMode } from "@lib/queue/loop";

export interface Arguments {
  guildId: string,
  loop: loopMode,
}

export interface Response {
  loop: loopMode;
}

