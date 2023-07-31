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

  public destroyQueue = (guildId: string, reason = "Unknown") => {
    this.queues.delete(guildId);
    state.log.controller.info(`Destroyed queue for ${guildId} with reason: ${reason}`);
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

  public async search(query: string, user: string): Promise<Track | { error: string }> {
    // If not Url search yt.
    if (!query.startsWith("https"))
      return await this.fetchYoutubeVideo(query, user);

    if (!play.is_expired()) {
      await play.refreshToken();
    }

    // If yt video.
    const urlType = play.yt_validate(query);

    if (urlType === "video") {
      return await this.getTrackFromUrl(query, user);
    }

    if (urlType === "playlist") {
      if (!query.includes("?v=")) return { error: "Playlists urls are not supported currently" }
      const videoUrl = query.split("&list=")[0];
      return await this.getTrackFromUrl(videoUrl, user);
    }

    if (urlType === "search") return { error: "Playlists and search urls are not supported currently" }

    // If spotify url
    if (play.sp_validate(query) == "track") {

      let song = await play
        .spotify(query)
        .catch(error => { state.log.queue.warn("Couldnt fetch spotify URL", { error }) });

      if (!song) return { error: "Couldnt play this song, please try a youtube link" }

      if (song.type !== "track") return { error: "Please enter a song url" }

      song = song as play.SpotifyTrack;

      return this.fetchYoutubeVideo(
        `${song.name} - ${song.artists[0].name}`,
        user,
      );
    }

    if (await play.so_validate(query))
      return { error: "Soundcloud links are not supported currently" }


    return await this.fetchYoutubeVideo(query, user);
  }

  private getTrackFromUrl = async (url: string, user: string) => {
    const song = await play
      .video_info(url)
      .catch((error) => {

        const message = error.message.toLowerCase();
        if (message.includes("private video"))
          return { error: "Can't play privated videos." }

        if (message.includes("confirm your age"))
          return { error: "Can't play age restricted videos. Try adding `lyrics` or `official audio` to your query if its a song!" }

        if (message.includes("unavailable"))
          return { error: "This video is unavailable in the bot's country." }

        state.log.queue.error("Couldnt fetch video info: ", { error });
      });

    if (!song) throw new Error("Couldnt fetch video info");
    if ("error" in song) return song;

    const info = song.video_details;
    const trackInput = {
      title: info.title,
      author: info.channel?.name,
      url: info.url,
      thumbnail: info.thumbnails[0].url,
      durationMs: info.durationInSec * 1000,
      requestedBy: user,
    };

    return new Track(trackInput, user);
  }

  private async fetchYoutubeVideo(searchQuery: string, user: string) {
    const song = await play.search(searchQuery, {
      source: { youtube: "video" },
      limit: 1,
      fuzzy: true,
    })
      .catch((error) => { state.log.queue.warn("Couldnt fetch search result: ", { error }); })
      .then((results) => results?.[0]);

    if (!song) return { error: "Couldnt play this song" }
    return await this.getTrackFromUrl(song.url, user);
  }
}
