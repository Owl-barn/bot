import { QueueInfo } from "@lib/queue/queueInfo";
import { BotTrack, BotCurrentTrack } from "@lib/queue/track";

export interface Arguments {
  guildId: string,
};

export interface Response {
  queue: BotTrack[];
  current: BotCurrentTrack | null;
  queueInfo: QueueInfo;
}
