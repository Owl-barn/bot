import { QueueInfo } from "@lib/queue/queueInfo";
import { CurrentTrack, Track } from "@lib/track";

export interface Arguments {
  guildId: string,
};

export interface Response {
  queue: Track[];
  current: CurrentTrack | null;
  queueInfo: QueueInfo;
}
