import { BotPlaylist } from "@lib/queue/playlist";
import { QueueInfo } from "@lib/queue/queueInfo";
import { BotTrack } from "@lib/queue/track";

export interface Arguments {
  guildId: string,
  channelId: string,
  userId: string,
  force: boolean,
  next: boolean,
  allowPlaylists: boolean,
  query: string,
};

export interface Response {
  track: BotTrack;
  playlist?: BotPlaylist;
  queueInfo: QueueInfo
}
