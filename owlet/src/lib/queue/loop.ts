import { QueueRepeatMode } from "discord-player";

export enum BotLoopMode {
  Off = 0,
  Track = 1,
  Queue = 2,
}

export function botLoopModeFromPlayer(mode: QueueRepeatMode): BotLoopMode {
  switch (mode) {
    case QueueRepeatMode.OFF:
      return BotLoopMode.Off;
    case QueueRepeatMode.TRACK:
      return BotLoopMode.Track;
    case QueueRepeatMode.QUEUE:
      return BotLoopMode.Queue;
    case QueueRepeatMode.AUTOPLAY:
      return BotLoopMode.Off;
  }
}

export function playerLoopModeFromBot(mode: BotLoopMode): QueueRepeatMode {
  switch (mode) {
    case BotLoopMode.Off:
      return QueueRepeatMode.OFF;
    case BotLoopMode.Track:
      return QueueRepeatMode.TRACK;
    case BotLoopMode.Queue:
      return QueueRepeatMode.QUEUE;
  }
}
