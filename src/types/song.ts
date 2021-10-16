import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import { Util } from "discord.js";
import ytdl from "ytdl-core";
import ytsr from "ytsr";

export default class Song {
    public title: string;
    public url: string;
    public duration: string;
    public artist: string;
    public thumbnail: string;

    public userID: string;

    public readonly onStart: () => void;
    public readonly onFinish: () => void;
    public readonly onError: (error: Error) => void;

    constructor(input: ytsr.Video, user: string) {
        this.title = Util.escapeMarkdown(input.title);
        this.url = input.url;
        this.duration = input.duration as string;
        this.artist = input.author?.name as string;
        this.thumbnail = input.bestThumbnail.url as string;

        this.userID = user;
    }

    public getStream = async (): Promise<AudioResource<Song>> => {
        const stream = ytdl(this.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary, metadata: this });
        return resource;
    }
}