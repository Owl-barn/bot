import { QueueInfo } from "../queue";
import { Track, CurrentTrack } from "../track";

export interface Arguments {
  guildId: string,
}

export interface Response {
  queue: Track[];
  current: CurrentTrack | null;
  queueInfo: QueueInfo;
}
