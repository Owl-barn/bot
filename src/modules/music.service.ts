import { AudioPlayer, VoiceConnection, createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, AudioPlayerState, entersState } from "@discordjs/voice";
import prisma from "../lib/db.service";
import Song from "../types/song";

export default class musicService {
    public readonly player: AudioPlayer;
    public readonly voiceConnection: VoiceConnection;
    private queue: Song[];
    private queueLock = false;
    private voteLock = ""
    private current: Song | null;
    private timeout: NodeJS.Timeout;
    public destroyed = false;
    private secondsPlayed = 0;
    private lastpause = 0;

    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
        this.player = createAudioPlayer();
        this.queue = [];

        this.player.on("stateChange", this.statechange);

        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, this.disconnectVoice);
        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => { this.timeout = setTimeout(() => this.stop(), 180000); });

        this.player.on(AudioPlayerStatus.Paused, this.pause);

        this.player.on("error", (error) => console.error(error));

        voiceConnection.subscribe(this.player);
    }

    private disconnectVoice = async (): Promise<void> => {
        try {
            // try reconnect.
            await Promise.race([
                entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch (error) {
            // actual disconnect, dont recover.
            this.voiceConnection.destroy();
        }
    }

    private statechange = (oldState: AudioPlayerState, newState: AudioPlayerState): void => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            void this.queueService();
        }
    }

    private pause = (oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Paused) {
            if (this.lastpause === 0) return;
            this.secondsPlayed += (Date.now() - this.lastpause) / 1000;
        }

        if (oldState.status === AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
            this.lastpause = Date.now();
        }
    }

    private logDuration = async (song: Song, played: number | null): Promise<void> => {
        await prisma.songs_played.create({
            data: {
                guild_id: this.voiceConnection.joinConfig.guildId,
                user_id: song.user.id,
                song_duration: song.duration.seconds,
                play_duration: played ? Math.ceil(played) : null,
            },
        });
    }

    public getCurrent = (): Song | null => {
        return this.current;
    }

    public getVoteLock = (): string => {
        return this.voteLock;
    }

    public setVoteLock = (data: string): void => {
        this.voteLock = data;
    }

    public getQueue = (): Song[] => {
        return this.queue;
    }

    public getPlaytime = (): number => {
        return Math.floor(this.secondsPlayed + (Date.now() - this.lastpause) / 1000);
    }

    public addToQueue = (song: Song): void => {
        this.queue.push(song);
        void this.queueService();
    }

    public skipIndex = (index: number): void => {
        const skipped = this.queue.splice(index - 1, 1)[0];
        this.logDuration(skipped, null);
    }

    public stop(): void {
        this.queue = [];
        this.player.stop(true);
        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();

        this.destroyed = true;
    }

    private queueService = async (): Promise<void> => {
        if (this.queueLock || (this.player.state.status !== AudioPlayerStatus.Idle)) {
            return;
        }

        this.queueLock = true;

        if (this.current) {
            this.secondsPlayed += (Date.now() - this.lastpause) / 1000;
            this.logDuration(this.current, this.secondsPlayed);
            this.secondsPlayed = 0;
            this.lastpause = 0;
        }

        if (this.queue.length === 0) {
            this.current = null;
            this.queueLock = false;
            this.timeout = setTimeout(() => this.stop(), 180000);
            return;
        }

        if (this.timeout) clearTimeout(this.timeout);

        const nextSong = this.queue.shift() as Song;
        try {
            const resource = await nextSong.getStream();
            this.player.play(resource);
            this.lastpause = Date.now();
            this.current = nextSong;
            this.voteLock = "";
            this.queueLock = false;
        } catch (e) {
            this.queueLock = false;
            console.error(e);
            return this.queueService();
        }

    }
}