import { Track, CurrentTrack } from "./track";

export enum QueueEvent {
  SongEnd = "songEnd",
  SongStart = "songStart",
  QueueEnd = "queueEnd",
  SongError = "songError",
  Shutdown = "shutdown",
}

export enum QueueRepeatMode {
  OFF = 0,
  TRACK = 1,
  QUEUE = 2,
  AUTOPLAY = 3,
}

export interface QueueInfo {
  length: number;
  size: number;
  paused: boolean;
  repeat: QueueRepeatMode;
}

export interface Queue {
  queue: Track[];
  current: CurrentTrack;
  queueInfo: QueueInfo;
  loop: boolean;
}
