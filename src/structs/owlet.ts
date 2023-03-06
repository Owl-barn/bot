export interface Track {
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationMs: number;
  requestedBy: string;
}

export interface CurrentSong extends Track {
  progress: string;
  progressMs: number;
}

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
  current: CurrentSong;
  queueInfo: QueueInfo;
  loop: boolean;
}


// WebSocket Server

export interface Credentials {
  id: string;
  token: string;
}

export interface wsRequest {
  mid: string;
  command: string;
  data: Record<string, unknown>;
}

export interface wsResponse {
  [key: string]: unknown;
  error?: string;
}
