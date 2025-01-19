import { Playlist } from "discord-player";

export class BotPlaylist {
  public size: number;
  public title: string;
  public url: string;
  public author: string;
  public thumbnail: string;
  public duration: string;
  public durationMs: number;

  constructor(data: Playlist) {
    this.size = data.tracks.length;
    this.title = data.title;
    this.url = data.url;
    this.author = data.author.name;
    this.thumbnail = data.thumbnail;
    this.duration = data.durationFormatted;
    this.durationMs = data.estimatedDuration;

  }
}
