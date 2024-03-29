import { AudioResource, createAudioResource } from "@discordjs/voice";
import { formatDuration } from "@lib/formatDuration";
import { escapeMarkdown } from "discord.js";
import { createId } from '@paralleldrive/cuid2';
import * as play from "play-dl";

export class Track {
  public id: string;
  public title: string;
  public author: string;
  public url: string;
  public thumbnail: string;
  public duration: string;
  public durationMs: number;
  public requestedBy: string;

  constructor(input: TrackInput, user: string) {
    const title =
      input.title !== undefined ? input.title : "couldnt load title";

    this.id = createId();
    this.title = escapeMarkdown(title.substring(0, 48).replace(/[()[\]]/g, ""));
    this.author = input.author ? escapeMarkdown(input.author) : "NaN";
    this.url = input.url;
    this.thumbnail = input.thumbnail as string;
    this.duration = formatDuration(input.durationMs)
    this.durationMs = input.durationMs;
    this.requestedBy = user;
  }

  public getStream = async (): Promise<AudioResource<Track>> => {
    const source = await play.stream(this.url, {
      quality: 2,
      discordPlayerCompatibility: true,
    });
    const resource = createAudioResource(source.stream, {
      inputType: source.type,
      metadata: this,
    });
    return resource;
  };
}

type TrackInput = {
  title: string | undefined;
  author: string | undefined;
  url: string;
  thumbnail: string;
  durationMs: number;
  requestedBy: string;
};

export interface CurrentTrack extends Track {
  progress: string;
  progressMs: number;
}
