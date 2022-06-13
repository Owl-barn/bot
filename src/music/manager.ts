import Queue from "./queue";
import Track from "./track";
import * as play from "play-dl";
import { VoiceChannel } from "discord.js";

export default class MusicPlayer {
    private queues: Map<string, Queue>;

    constructor() {
        this.queues = new Map();
    }

    public getQueue = (guildId: string) => this.queues.get(guildId);

    public createQueue = (channel: VoiceChannel) => {
        const queue = new Queue(channel, this);
        this.queues.set(channel.guildId, queue);
        return queue;
    };

    public destroyQueue = (guildId: string) => this.queues.delete(guildId);

    public async search(query: string, user: string): Promise<Track> {
        // If not Url search yt.
        if (!query.startsWith("https"))
            return await this.fetchVideo(query, user);

        if (!play.is_expired()) {
            await play.refreshToken();
        }

        // If yt video.
        if (play.yt_validate(query) === "video") {
            const result = await play.video_info(query).catch(() => null);
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

        // If spotify url
        if (play.sp_validate(query) == "track") {
            const song = (await play.spotify(query)) as play.SpotifyTrack;
            return this.fetchVideo(
                `${song.name} - ${song.artists[0].name}`,
                user,
            );
        }

        return await this.fetchVideo(query, user);
    }

    private async fetchVideo(searchQuery: string, user: string) {
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

// import {
//     AudioPlayer,
//     VoiceConnection,
//     createAudioPlayer,
//     VoiceConnectionStatus,
//     AudioPlayerStatus,
//     AudioPlayerState,
//     entersState,
// } from "@discordjs/voice";
// import { MessageEmbed, HexColorString, VoiceChannel } from "discord.js";
// import prisma from "../lib/db.service";
// import { returnMessage } from "../types/Command";
// import Song from "../types/song";

// class musicService {
//     public readonly player: AudioPlayer;
//     public readonly voiceConnection: VoiceConnection;

//     private queue: Song[];
//     private current: Song | null;
//     private queueLock = false;

//     private secondsPlayed = 0;
//     private lastpause = 0;

//     private loop = false;

//     private idle: NodeJS.Timeout;
//     private timeout: NodeJS.Timeout;
//     public destroyed = false;

//     constructor(voiceConnection: VoiceConnection) {
//         this.voiceConnection = voiceConnection;
//         this.player = createAudioPlayer();
//         this.queue = [];

//         this.player.on("stateChange", this.statechange);

//         this.voiceConnection.on(
//             VoiceConnectionStatus.Disconnected,
//             this.disconnectVoice,
//         );
//         this.voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
//             this.startStopTimer();
//         });

//         this.player.on(AudioPlayerStatus.Paused, this.pause);

//         this.player.on("error", (error) => console.error(error));

//         voiceConnection.subscribe(this.player);
//     }

//     private disconnectVoice = async (): Promise<void> => {
//         try {
//             // try reconnect.
//             await Promise.race([
//                 entersState(
//                     this.voiceConnection,
//                     VoiceConnectionStatus.Signalling,
//                     5_000,
//                 ),
//                 entersState(
//                     this.voiceConnection,
//                     VoiceConnectionStatus.Connecting,
//                     5_000,
//                 ),
//             ]);
//         } catch (error) {
//             // actual disconnect, dont recover.
//             this.voiceConnection.destroy();
//         }
//     };

//     private statechange = (
//         oldState: AudioPlayerState,
//         newState: AudioPlayerState,
//     ): void => {
//         if (
//             newState.status === AudioPlayerStatus.Idle &&
//             oldState.status !== AudioPlayerStatus.Idle
//         ) {
//             void this.queueService();
//         }
//     };

//     private pause = (
//         oldState: AudioPlayerState,
//         newState: AudioPlayerState,
//     ) => {
//         if (
//             oldState.status === AudioPlayerStatus.Playing &&
//             newState.status === AudioPlayerStatus.Paused
//         ) {
//             if (this.lastpause === 0) return;
//             this.secondsPlayed += (Date.now() - this.lastpause) / 1000;
//         }

//         if (
//             oldState.status === AudioPlayerStatus.Paused &&
//             newState.status === AudioPlayerStatus.Playing
//         ) {
//             this.lastpause = Date.now();
//         }
//     };

//     // IDLE
//     public setIdle = (x: boolean): void => {
//         x
//             ? (this.idle = setTimeout(() => this.stop(), 180000))
//             : clearTimeout(this.idle);
//     };

//     // TIMING

//     public getPlaytime = (): number => {
//         return Math.floor(
//             this.secondsPlayed + (Date.now() - this.lastpause) / 1000,
//         );
//     };

//     public queueLength = (): number => {
//         let queueLength = 0;

//         for (const song of this.queue) queueLength += song.duration.seconds;

//         if (!this.current) return queueLength;

//         return this.current.duration.seconds - this.getPlaytime() + queueLength;
//     };

//     private logDuration = async (
//         song: Song,
//         played: number | null,
//     ): Promise<void> => {
//         if (song.duration.seconds === 0) return;
//         if (played && played > song.duration.seconds)
//             played = song.duration.seconds;
//         await prisma.songs_played.create({
//             data: {
//                 guild_id: this.voiceConnection.joinConfig.guildId,
//                 user_id: song.user.id,
//                 song_duration: song.duration.seconds,
//                 play_duration: played ? Math.round(played) : null,
//             },
//         });
//     };

//     public startStopTimer(): void {
//         this.timeout = setTimeout(() => this.stop(), 180000);
//     }

//     // QUEUE

//     private reset = (): void => {
//         this.currentVote = null;
//         this.voted = new Set();
//         this.queueLock = false;
//     };

//     private queueService = async (): Promise<void> => {
//         if (
//             this.queueLock ||
//             this.player.state.status !== AudioPlayerStatus.Idle
//         ) {
//             return;
//         }

//         this.queueLock = true;

//         if (this.current) {
//             this.secondsPlayed += (Date.now() - this.lastpause) / 1000;
//             this.logDuration(this.current, this.secondsPlayed);
//             this.secondsPlayed = 0;
//             this.lastpause = 0;

//             if (this.loop) this.queue.push(this.current);
//         }

//         if (this.queue.length === 0) {
//             this.reset();
//             this.current = null;
//             this.startStopTimer();
//             return;
//         }

//         if (this.timeout) clearTimeout(this.timeout);

//         const nextSong = this.queue.shift() as Song;
//         try {
//             this.reset();
//             const resource = await nextSong.getStream();
//             this.player.play(resource);
//             this.lastpause = Date.now();
//             this.current = nextSong;
//         } catch (e) {
//             this.queueLock = false;
//             console.error(e);
//             return this.queueService();
//         }
//     };
// }
