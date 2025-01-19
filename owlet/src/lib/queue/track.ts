import { escapeMarkdown } from "discord.js";
import { GuildQueue, GuildQueuePlayerNode, Track } from "discord-player";
import { Duration } from "luxon";

export class BotTrack {
  public id: string;
  public title: string;
  public author: string;
  public url: string;
  public thumbnail: string;
  public duration: string;
  public durationMs: number;
  public requestedBy: string;
  public position?: number;

  constructor(track: Track<unknown>, node?: GuildQueuePlayerNode<unknown>) {
    this.id = track.id;
    this.title = track.title.substring(0, 48).replace(/[()[\]]/g, "");
    this.author = track.author ? escapeMarkdown(track.author) : "NaN";
    this.url = track.url;
    this.thumbnail = track.thumbnail;
    this.duration = track.duration;
    this.durationMs = track.durationMS;
    this.requestedBy = track.requestedBy!.id;

    if (node) {
      const position = node.getTrackPosition(track);
      if (position != -1) this.position = position;
    }
  }
}

export class BotCurrentTrack extends BotTrack {
  progress: string;
  progressMs: number;

  constructor(track: Track<unknown>, node: GuildQueuePlayerNode<unknown>) {
    super(track, node);
    this.progressMs = node.estimatedPlaybackTime;
    // ms into 03:34
    this.progress = Duration
      .fromMillis(node.estimatedPlaybackTime)
      .toFormat("mm:ss")
  }
}

export interface CurrentTrack extends BotTrack {
  progress: string;
  progressMs: number;
}
