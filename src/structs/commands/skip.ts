import { Track } from "@lib/track";

export interface Arguments {
  guildId: string,
  index: number,
};

export interface Response {
  track: Track;
}
