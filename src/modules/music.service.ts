import { AudioPlayer, VoiceConnection, createAudioPlayer, VoiceConnectionStatus, AudioPlayerStatus, AudioPlayerState, entersState } from "@discordjs/voice";
import Song from "../types/song";

export default class musicService {
    public readonly player: AudioPlayer;
    public readonly voiceConnection: VoiceConnection;
    private queue: Song[];
    private queueLock = false;
    private voteLock = ""
    private current: Song;


    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
        this.player = createAudioPlayer();
        this.queue = [];

        this.player.on("stateChange", this.statechange);

        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, this.disconnectVoice);
        this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => this.stop());

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
        console.log(newState.status);
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            void this.queueService();
        }
    }

    public getCurrent = (): Song => {
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

    public addToQueue = (song: Song): void => {
        this.queue.push(song);
        void this.queueService();
    }

    public stop(): void {
        this.queue = [];
        this.player.stop(true);
        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
    }

    private queueService = async (): Promise<void> => {
        if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
            return;
        }

        this.queueLock = true;

        if (this.queue.length === 0) {
            this.stop();
            return;
        }

        const nextSong = this.queue.shift() as Song;
        try {
            const resource = await nextSong.getStream();
            this.player.play(resource);
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