import { AudioResource, createAudioResource } from "@discordjs/voice";
import { User, Util } from "discord.js";
import * as play from "play-dl";

export default class Song {
    public title: string;
    public url: string;
    public duration: number;
    public artist: string;
    public thumbnail: string;

    public user: User

    public readonly onStart: () => void;
    public readonly onFinish: () => void;
    public readonly onError: (error: Error) => void;

    constructor(input: play.YouTubeVideo, user: User) {
        this.title = Util.escapeMarkdown(input.title || "couldnt load title");
        this.url = input.url;
        this.duration = input.durationInSec;
        this.artist = Util.escapeMarkdown(input.channel?.name as string);
        this.thumbnail = input.thumbnail?.url as string;

        this.user = user;
    }

    public getStream = async (): Promise<AudioResource<Song>> => {
        const source = await play.stream(this.url, { quality: 2 });
        const resource = createAudioResource(source.stream, { inputType: source.type, metadata: this });
        return resource;
    }
}