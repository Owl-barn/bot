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
import RepeatMode from "../types/repeatmode";
import MusicPlayer from "./manager";
import Track from "./track";

export default class Queue {
    private readonly guild: string;
    private readonly musicPlayer: MusicPlayer;

    public readonly player: AudioPlayer;
    public readonly voiceConnection: VoiceConnection;

    private queueLock = false;
    private leaveTimeout: NodeJS.Timeout;
    public destroyed = false;

    private queue: Track[] = [];
    private current: Track | null = null;
    private repeatMode: RepeatMode = RepeatMode.Off;

    constructor(channel: VoiceChannel, musicPlayer: MusicPlayer) {
        this.guild = channel.guildId;
        this.musicPlayer = musicPlayer;
        this.queue = [];
        this.current = null;

        this.voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild
                .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });

        this.player = createAudioPlayer();

        this.player.on("stateChange", this.statechange);

        this.voiceConnection.subscribe(this.player);

        entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Ready,
            20e3,
        ).catch(console.error);
    }

    private statechange = (
        oldState: AudioPlayerState,
        newState: AudioPlayerState,
    ): void => {
        if (
            newState.status === AudioPlayerStatus.Idle &&
            oldState.status !== AudioPlayerStatus.Idle
        ) {
            void this.trackEnd();
        }
    };

    /**
     * Sets the repeat mode of the current queue.
     * @param mode `Off`, `Track` or `Queue`.
     */
    public setRepeatMode(mode: RepeatMode): void {
        this.repeatMode = mode;
    }

    public getRepeatMode(): RepeatMode {
        return this.repeatMode;
    }

    /**
     * Skips the current song.
     */
    public skip(): void {
        this.player.stop();
    }

    /**
     * Remove a track from the queue.
     * @param track
     */
    public removeTrack(track: Track | number): void {
        if (typeof track === "number") this.queue.splice(track - 1);
        else this.queue.splice(this.queue.indexOf(track));
    }

    /**
     * Terminates the current queue.
     */
    public stop(): void {
        this.queue = [];
        this.player.stop(true);

        if (
            this.voiceConnection.state.status !==
            VoiceConnectionStatus.Destroyed
        )
            this.voiceConnection.destroy();

        this.musicPlayer.destroyQueue(this.guild);
    }

    /**
     * Adds the given track to the queue.
     * @param track The track to add to the queue.
     */
    public addTrack(track: Track): void {
        this.queue.push(track);
        void this.trackEnd();
    }

    /**
     * Immediately plays the given track.
     * @param track The track to play.
     */
    public play(track: Track): void {
        track.getStream().then((stream) => {
            this.player.play(stream);
            this.current = track;
        });
    }

    /**
     * Returns the current queue.
     */
    public getTracks(): Track[] {
        return this.queue;
    }

    /**
     * Returns the current track.
     */
    public nowPlaying(): Track | null {
        return this.current;
    }

    /**
     *
     * @returns returns `true` if the track is paused.
     */
    public pause(): boolean {
        const state = this.player.state.status == AudioPlayerStatus.Paused;
        const success = state ? this.player.unpause() : this.player.pause();
        if (!success) throw new Error("Failed to pause/unpause");
        return state;
    }

    private trackEnd(): void {
        if (
            this.queueLock ||
            this.player.state.status !== AudioPlayerStatus.Idle
        ) {
            return;
        }

        this.queueLock = true;

        // There was a track playing.
        if (this.current) {
            if (this.repeatMode === RepeatMode.Track)
                this.queue.unshift(this.current);
            else if (this.repeatMode === RepeatMode.Queue)
                this.queue.push(this.current);
        }

        // Queue is empty
        if (this.queue.length === 0) {
            this.leaveTimeout = setTimeout(this.stop, 20000);
            this.current = null;
            return;
        }

        if (this.leaveTimeout) clearTimeout(this.leaveTimeout);

        const nextSong = this.queue.shift() as Track;

        try {
            this.play(nextSong);
        } catch (e) {
            console.error(e);
            this.trackEnd();
        } finally {
            this.queueLock = false;
        }
    }
}
