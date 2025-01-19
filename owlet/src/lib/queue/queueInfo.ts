import { BotLoopMode, botLoopModeFromPlayer } from "./loop";
import { GuildQueue } from "discord-player";

export function getQueueInfo(queue: GuildQueue): QueueInfo {

  let length = queue.tracks
    .map((track) => track.durationMS)
    .reduce((total, current) => total + current, 0);

  const current = queue.currentTrack;

  if (current) length += queue.node.estimatedDuration - queue.node.estimatedPlaybackTime;

  return {
    length,
    size: queue.tracks.size,
    loop: botLoopModeFromPlayer(queue.repeatMode),
    isShuffling: queue.isShuffling,
    paused: queue.node.isPaused(),
  };
}

export interface QueueInfo {
  length: number;
  size: number;
  paused: boolean;
  loop: BotLoopMode;
  isShuffling: boolean;
}
