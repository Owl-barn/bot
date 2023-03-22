import { AudioPlayerStatus } from "@discordjs/voice";
import { Queue } from ".";
import { loopMode } from "./loop";

export function getQueueInfo(queue: Queue): QueueInfo {
  const tracks = queue.getTracks();

  let length = tracks
    .map((track) => track.durationMs)
    .reduce((total, current) => total + current, 0);

  const current = queue.nowPlaying();

  if (current) length += current.durationMs - current.progressMs;

  return {
    length,
    size: tracks.length,
    loop: queue.getLoopMode(),
    paused: queue.player.state.status === AudioPlayerStatus.Paused,
  };
}

export interface QueueInfo {
  length: number;
  size: number;
  paused: boolean;
  loop: loopMode;
}
