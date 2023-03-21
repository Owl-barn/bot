import { QueueInfo } from "../queue";
import { Track } from "../track";

export interface Arguments {
  guildId: string,
  channelId: string,
  userId: string,
  force: boolean,
  query: string,
}

export interface Response {
  track: Track;
  queueInfo: QueueInfo
}
