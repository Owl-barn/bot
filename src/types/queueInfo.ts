export interface QueueInfo {
  length: number;
  size: number;
  paused: boolean;
  repeat: QueueRepeatMode;
}

// eslint-disable-next-line no-shadow
declare enum QueueRepeatMode {
  OFF = 0,
  TRACK = 1,
  QUEUE = 2,
  AUTOPLAY = 3,
}
