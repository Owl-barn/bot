import { GuildQueue } from "discord-player";
import { getQueueInfo, QueueInfo } from "./queueInfo";
import { BotCurrentTrack, BotTrack } from "./track";
import { BotLoopMode, botLoopModeFromPlayer } from "./loop";

export class BotQueue {
  public queue: BotTrack[];
  public current: BotCurrentTrack | null;
  public queueInfo: QueueInfo;
  public loop: BotLoopMode;

  constructor(queue: GuildQueue<unknown>) {
    this.queue = queue.tracks.map((track) => new BotTrack(track));
    this.current = queue.currentTrack ? new BotCurrentTrack(queue.currentTrack, queue.node) : null;
    this.queueInfo = getQueueInfo(queue);
    this.loop = botLoopModeFromPlayer(queue.repeatMode);
  }
}
