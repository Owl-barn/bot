import { Queue, QueueEvent } from "./queue";
import { CurrentTrack } from "./track";

export type Events = {
  [QueueEvent.Shutdown]: { guildId: string, channelId: string };
  [QueueEvent.QueueEnd]: { queue: Queue, channelId: string, guildId: string };
  [QueueEvent.SongEnd]: { track: CurrentTrack, queue: Queue, channelId: string, guildId: string };
  [QueueEvent.SongStart]: { track: CurrentTrack, queue: Queue, channelId: string, guildId: string };
  [QueueEvent.SongError]: { track: CurrentTrack, queue: Queue, channelId: string, guildId: string };
}

export type EventKey = keyof Events;
