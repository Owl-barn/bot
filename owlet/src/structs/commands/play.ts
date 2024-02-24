import { QueueInfo } from "@lib/queue/queueInfo";
import { Track } from "@lib/track";

export interface Arguments {
  guildId: string,
  channelId: string,
  userId: string,
  force: boolean,
  query: string,
};

export interface Response {
  track: Track;
  queueInfo: QueueInfo
}
