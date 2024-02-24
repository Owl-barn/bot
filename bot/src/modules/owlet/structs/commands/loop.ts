import { LoopMode } from "../queue";

export interface Arguments {
  guildId: string,
  loop: LoopMode,
}

export interface Response {
  loop: LoopMode;
}

