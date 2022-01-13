import { AudioPlayer, VoiceConnection, createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, AudioPlayerState, entersState } from "@discordjs/voice";
import { MessageEmbed, HexColorString } from "discord.js";
import prisma from "../lib/db.service";
import { returnMessage } from "../types/Command";
import Song from "../types/song";

export default class musicService {
    public readonly player: AudioPlayer;
    public readonly voiceConnection: VoiceConnection;

    private queue: Song[];
    private current: Song | null;
    private queueLock = false;

    private currentVote: Vote | null = null;
    private voted: Set<string> = new Set();

    private secondsPlayed = 0;
    private lastpause = 0;

    private timeout: NodeJS.Timeout;
    public destroyed = false;

    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
        this.player = createAudioPlayer();
        this.queue = [];

        this.player.on("stateChange", this.statechange);

        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, this.disconnectVoice);
        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => { this.startStopTimer(); });

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

    public getCurrent = (): Song | null => {
        return this.current;
    }

    public stop(): void {
        console.log(`music ended in ${this.voiceConnection.joinConfig.guildId}`.yellow);
        this.queue = [];
        this.player.stop(true);
        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();

        this.destroyed = true;
    }

    // VOTE SKIP

    public getVoteLock = (): Vote | null => {
        return this.currentVote;
    }

    public setVoteLock = (): void => {
        if (!this.current?.id) throw "No song playing";
        this.currentVote = {
            id: this.current.id,
            start: Date.now(),
        };
    }

    public addVote = (user: string): Set<string> => {
        this.voted.add(user);

        return this.voted;
    }

    public removeVote = (user: string): Set<string> => {
        this.voted.delete(user);

        return this.voted;
    }


    public getVotes = (): Set<string> => {
        return this.voted;
    }

    public skip = (index?: number | null): returnMessage => {
        const failEmbed = new MessageEmbed()
            .setDescription(`Out of range`)
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const queue = this.getQueue();
        if (!index) this.player.stop();
        else if (index > queue.length) return { embeds: [failEmbed] };
        else {
            const skipped = this.queue.splice(index - 1, 1)[0];
            this.logDuration(skipped, null);
        }

        const embed = new MessageEmbed()
            .setDescription("Song skipped!")
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed], components: [] };
    }

    // TIMING

    public getPlaytime = (): number => {
        return Math.floor(this.secondsPlayed + (Date.now() - this.lastpause) / 1000);
    }

    public queueLength = (): number => {
        let queueLength = 0;

        for (const song of this.queue) queueLength += song.duration.seconds;

        if (!this.current) return queueLength;

        return (this.current.duration.seconds - this.getPlaytime()) + queueLength;
    }

    private logDuration = async (song: Song, played: number | null): Promise<void> => {
        await prisma.songs_played.create({
            data: {
                guild_id: this.voiceConnection.joinConfig.guildId,
                user_id: song.user.id,
                song_duration: song.duration.seconds,
                play_duration: played ? Math.round(played) : null,
            },
        });
    }

    public startStopTimer(): void {
        console.log(`music queue ended in ${this.voiceConnection.joinConfig.guildId}`.yellow);
        this.timeout = setTimeout(() => this.stop(), 180000);
    }

    // QUEUE

    public getQueue = (): Song[] => {
        return this.queue;
    }

    public addToQueue = (song: Song): void => {
        this.queue.push(song);
        void this.queueService();
    }

    private reset = (): void => {
        this.currentVote = null;
        this.voted = new Set();
        this.queueLock = false;
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
            this.reset();
            this.current = null;
            this.startStopTimer();
            return;
        }

        if (this.timeout) clearTimeout(this.timeout);

        const nextSong = this.queue.shift() as Song;
        try {
            this.reset();
            const resource = await nextSong.getStream();
            this.player.play(resource);
            this.lastpause = Date.now();
            this.current = nextSong;
        } catch (e) {
            this.queueLock = false;
            console.error(e);
            return this.queueService();
        }

    }
}

export interface Vote {
    id: string;
    start: number;
}