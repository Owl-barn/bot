import { BotLoopMode } from "@lib/queue/loop";

export interface Arguments {
  guildId: string,
  loop: BotLoopMode,
}

export interface Response {
  loop: BotLoopMode;
}

