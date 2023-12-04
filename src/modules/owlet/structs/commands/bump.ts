import { Track } from "../track";

export interface Arguments {
  guildId: string,
  userId: string,
  query: string | number,
}

export interface Response {
  track: Track;
}
