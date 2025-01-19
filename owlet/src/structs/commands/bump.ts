import { BotTrack } from "@lib/queue/track";

export interface Arguments {
  guildId: string,
  userId: string,
  query: string | number,
};

export interface Response {
  track: BotTrack;
}
