import { Playlist } from "../playlist";
import { QueueInfo } from "../queue";
import { Track } from "../track";

export interface Arguments {
  guildId: string,
  channelId: string,
  userId: string,
  force: boolean,
  next: boolean,
  allowPlaylists: boolean,
  query: string,
}

export interface Response {
  track: Track;
  playlist?: Playlist;
  queueInfo: QueueInfo
}
