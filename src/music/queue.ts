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
import { VoiceChannel } from "discord.js";
import moment from "moment";
import RepeatMode from "../types/repeatmode";
import MusicPlayer from "./manager";
import Track, { CurrentTrack } from "./track";
import QueueEvent from "../types/queueevent";

export default class Queue {
    private readonly guild: string;
    private readonly musicPlayer: MusicPlayer;

    public readonly player: AudioPlayer;
    public readonly voiceConnection: VoiceConnection;

    private queueLock = false;
    private leaveTimeout: NodeJS.Timeout;
    public destroyed = false;

    private lastpause: number = 0;
    private playedMs: number = 0;

    private callbacks: Map<string, ((...args: any[]) => Promise<void>)[]> =
        new Map();

    private queue: Track[] = [];
    private current: Track | null = null;
    private repeatMode: RepeatMode = RepeatMode.Off;

    constructor(channel: VoiceChannel, musicPlayer: MusicPlayer) {
        this.guild = channel.guildId;
        this.musicPlayer = musicPlayer;
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
        this.player.on("error", (error) => console.error(error));

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
    public setRepeatMode = (mode: RepeatMode): void => {
        this.repeatMode = mode;
    };

    /**
     * Shows you what the repeat mode is currently set to.
     * @returns The current repeat mode.
     */
    public getRepeatMode = (): RepeatMode => {
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

        this.musicPlayer.destroyQueue(this.guild);
    };

    /**
     * Adds the given track to the queue.
     * @param track The track to add to the queue.
     */
    public addTrack = (track: Track): void => {
        this.queue.push(track);
        void this.onIdle();
    };

    /**
     * Immediately plays the given track.
     * @param track The track to play.
     */
    public play = (track: Track): void => {
        track.getStream().then((stream) => {
            this.player.play(stream);
            this.current = track;
        });
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
            progress: moment()
                .startOf("day")
                .milliseconds(progressMs)
                .format("H:mm:ss"),
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
        console.log("Setting idle timeout");
        this.leaveTimeout = setTimeout(() => this.stop(), duration);
    };

    /**
     * Clear the timeout to stop the bot.
     */
    public clearIdle = (): void => {
        console.log("Clearing idle timeout");
        if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
    };

    /**
     * Add Event listeners to the queue.
     * @param event The event to listen to.
     * @param callback The callback to call when the event is triggered.
     */
    public on(
        event: QueueEvent.QueueEnd,
        callback: (queue: Queue) => Promise<void>,
    ): void;

    public on(
        event: QueueEvent.SongEnd,
        callback: (track: Track) => Promise<void>,
    ): void;

    public on(
        event: QueueEvent,
        callback: (...args: any[]) => Promise<void>,
    ): void {
        if (!this.callbacks.get(event)) this.callbacks.set(event, []);
        this.callbacks.get(event)?.push(callback);
    }

    /**
     * This function calls all callbacks for the given event.
     * @param event The event to emit.
     * @param args The arguments to pass to the callback.
     * @returns `void`
     */
    private emit = (event: string, ...args: any[]): void => {
        console.log(`Emitting ${event}`);
        const promises = this.callbacks
            .get(event)
            ?.map((callback) => callback(...args));
        if (!promises) return;
        Promise.all(promises).catch(console.error);
    };

    private onIdle = (): void => {
        if (
            this.queueLock ||
            this.player.state.status !== AudioPlayerStatus.Idle
        ) {
            return;
        }

        this.queueLock = true;

        // There was a track playing.
        if (this.current) {
            this.playedMs = 0;
            this.lastpause = 0;

            if (this.repeatMode === RepeatMode.Track)
                this.queue.unshift(this.current);
            else if (this.repeatMode === RepeatMode.Queue)
                this.queue.push(this.current);
            this.emit(QueueEvent.SongEnd, this.current);
        }

        // Queue is empty
        if (this.queue.length === 0) {
            this.leaveTimeout = setTimeout(this.stop, 20000);
            this.current = null;
            this.queueLock = false;
            this.emit(QueueEvent.QueueEnd, this.guild);
            return;
        }

        if (this.leaveTimeout) clearTimeout(this.leaveTimeout);

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
        if (
            oldState.status === AudioPlayerStatus.Playing &&
            newState.status === AudioPlayerStatus.Paused
        ) {
            if (this.lastpause === 0) return;
            this.playedMs += Date.now() - this.lastpause;
        }

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
            this.voiceConnection.destroy();
        }
    };
}
