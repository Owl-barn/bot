import { Track, CurrentTrack } from "./track";

export enum QueueEvent {
  SongEnd = "SongEnd",
  SongStart = "SongStart",
  QueueEnd = "QueueEnd",
  SongError = "SongError",
  Shutdown = "Shutdown",
}

export enum LoopMode {
  OFF = 0,
  TRACK = 1,
  QUEUE = 2,
  AUTOPLAY = 3,
}

export interface QueueInfo {
  length: number;
  size: number;
  paused: boolean;
  loop: LoopMode;
  isShuffling: boolean;
}

export interface Queue {
  queue: Track[];
  current: CurrentTrack;
  queueInfo: QueueInfo;
  loop: boolean;
}
