import { state } from "@app";
import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  createAudioPlayer,
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Events } from "./events";
import { EventEmitter } from "events";
import { CurrentTrack, Track } from "@lib/track";
import { VoiceBasedChannel } from "discord.js";
import { loopMode } from "./loop";
import { formatDuration } from "@lib/formatDuration";


declare interface Queue {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

class Queue extends EventEmitter {
  private readonly guild: string;

  public readonly player: AudioPlayer;
  public readonly voiceConnection: VoiceConnection;

  private queueLock = false;
  private leaveTimeout: NodeJS.Timeout | undefined;
  public destroyed = false;

  private lastpause: number = 0;
  private playedMs: number = 0;


  private queue: Track[] = [];
  private current: Track | null = null;
  private repeatMode: loopMode = loopMode.Off;

  constructor(channel: VoiceBasedChannel) {
    super();
    this.guild = channel.guildId;
    this.queue = [];
    this.current = null;

    // Initialize the voice connection.
    const adapterCreator = channel.guild
      .voiceAdapterCreator as DiscordGatewayAdapterCreator;
    this.voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator,
    });

    this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
      this.stop();
    });
    this.voiceConnection.on(
      VoiceConnectionStatus.Disconnected,
      this.onDisconnect,
    );

    // Initialize the audio player.
    this.player = createAudioPlayer();
    this.player.on("stateChange" as any, this.onStateChange);
    this.player.on(AudioPlayerStatus.Paused, this.onPause);
    this.player.on("error", console.error);

    // Subscribe to the player.
    this.voiceConnection.subscribe(this.player);

    entersState(
      this.voiceConnection,
      VoiceConnectionStatus.Ready,
      20e3,
    ).catch(console.error);
  }

  /**
   * Sets the repeat mode of the current queue.
   * @param mode `Off`, `Track` or `Queue`.
   */
  public setRepeatMode = (mode: loopMode): void => {
    this.repeatMode = mode;
  };

  /**
   * Shows you what the repeat mode is currently set to.
   * @returns The current repeat mode.
   */
  public getRepeatMode = (): loopMode => {
    return this.repeatMode;
  };

  /**
   * Skips the current song.
   */
  public skip = (): Track | null => {
    this.player.stop();
    return this.current;
  };

  /**
   * Remove a track from the queue.
   * @param track
   */
  public removeTrack = (track: Track | number): Track | null => {
    let removed: Track;
    if (track instanceof Track)
      removed = this.queue.splice(this.queue.indexOf(track), 1)[0];
    else removed = this.queue.splice(track, 1)[0];

    return removed;
  };

  /**
   * Terminates the current queue.
   */
  public stop = (): void => {
    this.queue = [];
    this.player.stop(true);

    if (
      this.voiceConnection.state.status !==
      VoiceConnectionStatus.Destroyed
    )
      this.voiceConnection.destroy();

    state.controller.destroyQueue(this.guild);
  };

  /**
   * Adds the given track to the queue.
   * @param track The track to add to the queue.
   */
  public addTrack = (track: Track, addToFront?: boolean): void => {
    if (addToFront) this.queue.unshift(track);
    else this.queue.push(track);
    void this.onIdle();
  };

  /**
   * Immediately plays the given track.
   * @param track The track to play.
   */
  public play = async (track: Track): Promise<void> => {
    // Get the track stream.
    const stream = await track.getStream().catch((e) => {
      console.error(e);
      this.emit("SongError", track, this.queue);
    });

    if (!stream) return;

    // Play the track.
    this.player.play(stream);

    // If there is a current track, emit the Songstart event.
    if (this.current)
      this.emit("SongStart", this.current, this.queue);

    this.current = track;
    return;
  };

  /**
   * Returns the current queue.
   */
  public getTracks = (): Track[] => {
    return this.queue;
  };

  /**
   * Returns the current track.
   */
  public nowPlaying = (): CurrentTrack | null => {
    if (this.current === null) return null;
    let progressMs = this.playedMs;
    if (this.player.state.status === AudioPlayerStatus.Playing)
      progressMs += Date.now() - this.lastpause;
    return {
      ...this.current,
      progressMs,
      progress: formatDuration(progressMs)
    };
  };

  /**
   *
   * @returns returns `true` if the track is paused.
   */
  public pause = (): boolean => {
    const state = this.player.state.status == AudioPlayerStatus.Paused;
    const success = state ? this.player.unpause() : this.player.pause();
    if (!success) throw new Error("Failed to pause/unpause");
    return state;
  };

  /**
   * Start a timeout to stop the bot.
   * @param duration The time in milliseconds to wait before stopping the queue.
   */
  public setIdle = (duration: number): void => {
    this.leaveTimeout = setTimeout(() => this.stop(), duration);
  };

  /**
   * Clear the timeout to stop the bot.
   */
  public clearIdle = (): void => {
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
  };

  private onIdle = (): void => {
    const isIdle = this.player.state.status === AudioPlayerStatus.Idle;
    if (this.queueLock || !isIdle) return;

    this.queueLock = true;

    // There was a track playing.
    if (this.current) {
      this.emit("SongEnd", this.nowPlaying()!, this.queue);

      this.playedMs = 0;
      this.lastpause = 0;

      if (state.controller.isShutdown()) {
        this.voiceConnection.disconnect();
        state.controller.destroyQueue(this.guild);
      }

      if (this.repeatMode === loopMode.Track)
        this.queue.unshift(this.current);
      else if (this.repeatMode === loopMode.Queue)
        this.queue.push(this.current);
    }

    // Queue is empty
    if (this.queue.length === 0) {
      this.setIdle(state.env.IDLE_TIMEOUT);
      this.current = null;
      this.queueLock = false;

      this.emit("QueueEnd", this.queue);
      return;
    }

    this.clearIdle();

    const nextSong = this.queue.shift() as Track;

    try {
      this.play(nextSong);
      this.lastpause = Date.now();
    } catch (e) {
      console.error(e);
      this.onIdle();
    } finally {
      this.queueLock = false;
    }
  };

  private onStateChange = (
    oldState: AudioPlayerState,
    newState: AudioPlayerState,
  ): void => {
    if (
      newState.status === AudioPlayerStatus.Idle &&
      oldState.status !== AudioPlayerStatus.Idle
    ) {
      void this.onIdle();
    }
  };

  private onPause = (
    oldState: AudioPlayerState,
    newState: AudioPlayerState,
  ) => {
    // Player is paused
    if (
      oldState.status === AudioPlayerStatus.Playing &&
      newState.status === AudioPlayerStatus.Paused
    ) {
      if (this.lastpause === 0) return;
      this.playedMs += Date.now() - this.lastpause;
    }

    // Player is unpaused
    if (
      oldState.status === AudioPlayerStatus.Paused &&
      newState.status === AudioPlayerStatus.Playing
    ) {
      this.lastpause = Date.now();
    }
  };

  private onDisconnect = async (): Promise<void> => {
    try {
      // try reconnect.
      await Promise.race([
        entersState(
          this.voiceConnection,
          VoiceConnectionStatus.Signalling,
          5_000,
        ),
        entersState(
          this.voiceConnection,
          VoiceConnectionStatus.Connecting,
          5_000,
        ),
      ]);
    } catch (error) {
      // actual disconnect, dont recover.
      if (
        this.voiceConnection.state.status !==
        VoiceConnectionStatus.Destroyed
      )
        this.voiceConnection.destroy();
    }
  };
}

export { Queue };
