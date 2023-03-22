import * as play from "play-dl";
import { VoiceBasedChannel } from "discord.js";
import { Queue } from "@lib/queue";
import { state } from "@app";
import { Track } from "@lib/track";

export class Controller {
  private queues: Map<string, Queue>;
  private shutdown = false;

  constructor() {
    this.login();
    this.queues = new Map();
  }

  private async login() {
    await play.setToken({
      spotify: {
        client_id: state.env.SP_ID,
        client_secret: state.env.SP_SECRET,
        refresh_token: state.env.SP_RT,
        market: state.env.SP_MARKET,
      },
    })
    state.log.controller.info("Spotify token set");
  }

  public getQueue = (guildId: string) => this.queues.get(guildId);

  public getQueues = () => this.queues;

  public createQueue = (channel: VoiceBasedChannel) => {
    const queue = new Queue(channel);
    this.queues.set(channel.guildId, queue);
    state.log.controller.debug(`Created queue for ${channel.guildId}`);
    return queue;
  };

  public destroyQueue = (guildId: string) => {
    this.queues.delete(guildId);
    state.log.controller.info(`Destroyed queue for ${guildId}`);
    if (this.shutdown && this.queues.size === 0) return process.exit(1);
  };

  public softShutdown = () => {
    this.shutdown = true;

    // Broadcast shutdown to all users.
    state.log.controller.info(`Emitting shutdown to ${this.queues.size} queues`);
    this.queues.forEach(async (queue) => {
      queue.voiceConnection.joinConfig;

      state.server.broadcast(
        "Shutdown",
        queue.voiceConnection.joinConfig.guildId,
        queue.voiceConnection.joinConfig.channelId ?? undefined,
      );

    });

    // If no queues left, exit.
    if (this.queues.size === 0) return process.exit(1);
  };

  public isShutdown = () => this.shutdown;

  public async search(query: string, user: string): Promise<Track> {
    // If not Url search yt.
    if (!query.startsWith("https"))
      return await this.fetchYoutubeVideo(query, user);

    if (!play.is_expired()) {
      await play.refreshToken();
    }

    // If yt video.
    const ytValidate = play.yt_validate(query);
    if (ytValidate === "video") {
      const result = await play.video_info(query).catch((e) => { state.log.queue.error(e) });
      if (!result) throw "Couldnt play this song";
      const videoData = result.video_details;
      const trackInput = {
        title: videoData.title,
        author: videoData.channel?.name,
        url: videoData.url,
        thumbnail: videoData.thumbnails[0].url,
        durationMs: videoData.durationInSec * 1000,
        requestedBy: user,
      };

      return new Track(trackInput, user);
    }

    if (ytValidate === "playlist" || ytValidate === "search") {
      throw "Playlists and search urls are not supported currently";
    }

    // If spotify url
    if (play.sp_validate(query) == "track") {
      let song = await play.spotify(query).catch(() => null);
      if (!song)
        throw "Couldnt play this song, please try a youtube link";
      if (song.type !== "track") throw "Please enter a song url";
      song = song as play.SpotifyTrack;
      return this.fetchYoutubeVideo(
        `${song.name} - ${song.artists[0].name}`,
        user,
      );
    }

    if (await play.so_validate(query)) {
      throw "Soundcloud links are not supported currently";
    }

    return await this.fetchYoutubeVideo(query, user);
  }

  private async fetchYoutubeVideo(searchQuery: string, user: string) {
    const searchResult = (
      await play.search(searchQuery, {
        source: { youtube: "video" },
        limit: 1,
        fuzzy: true,
      })
    )[0];

    const trackInput = {
      title: searchResult.title,
      author: searchResult.channel?.name,
      url: searchResult.url,
      thumbnail: searchResult.thumbnails[0].url,
      durationMs: searchResult.durationInSec * 1000,
      requestedBy: user,
    };

    const track = new Track(trackInput, user);
    return track;
  }
}
