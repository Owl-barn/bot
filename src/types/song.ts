import { AudioResource, createAudioResource } from "@discordjs/voice";
import { User, Util } from "discord.js";
import moment from "moment";
import * as play from "play-dl";

export default class Song {
    public id: string;
    public title: Title;
    public url: string;
    public duration: SongDuration;
    public artist: Artist;
    public thumbnail: string;

    public user: User

    public readonly onStart: () => void;
    public readonly onFinish: () => void;
    public readonly onError: (error: Error) => void;

    constructor(input: play.YouTubeVideo, user: User) {
        this.id = `${Date.now()}`;
        this.title = {
            formatted: Util.escapeMarkdown((input.title || "couldnt load title").substring(0, 48).replace(/[()[\]]/g, "")),
            original: input.title || "couldnt load title",
        };
        this.url = input.url;
        this.duration = {
            seconds: input.durationInSec,
            text: moment().startOf("day").seconds(input.durationInSec).format("H:mm:ss"),
        };
        this.artist = {
            name: Util.escapeMarkdown(input.channel?.name as string),
            url: input.channel?.url || "",
        };
        this.thumbnail = input.thumbnail?.url as string;

        this.user = user;
    }

    public getStream = async (): Promise<AudioResource<Song>> => {
        const source = await play.stream(this.url, { quality: 2 });
        const resource = createAudioResource(source.stream, { inputType: source.type, metadata: this });
        return resource;
    }
}

export interface Title {
    formatted: string;
    original: string;
}

export interface SongDuration {
    seconds: number;
    text: string;
}

export interface Artist {
    name: string;
    url: string;
}