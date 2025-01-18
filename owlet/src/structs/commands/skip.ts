import { BotTrack } from "@lib/queue/track";

export interface Arguments {
  guildId: string,
  userId: string,
  canForce?: boolean,
  index?: number,
  trackId?: string,
};

export interface Response {
  track: BotTrack;
}
