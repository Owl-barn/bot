import { AudioResource, createAudioResource } from "@discordjs/voice";
import { Util } from "discord.js";
import moment from "moment";
import * as play from "play-dl";

export default class Track {
    public title: string;
    public author: string;
    public url: string;
    public thumbnail: string;
    public duration: string;
    public durationMs: number;
    public requestedBy: string;

    constructor(input: TrackInput, user: string) {
        this.title = Util.escapeMarkdown(
            (input.title || "couldnt load title")
                .substring(0, 48)
                .replace(/[()[\]]/g, ""),
        );
        this.author = input.author ? Util.escapeMarkdown(input.author) : "NaN";
        this.url = input.url;
        this.thumbnail = input.thumbnail as string;
        this.duration = moment()
            .startOf("day")
            .milliseconds(input.durationMs)
            .format("H:mm:ss");
        this.durationMs = input.durationMs;
        this.requestedBy = user;
    }

    public getStream = async (): Promise<AudioResource<Track>> => {
        const source = await play.stream(this.url, {
            quality: 2,
            discordPlayerCompatibility: true,
        });
        const resource = createAudioResource(source.stream, {
            inputType: source.type,
            metadata: this,
        });
        return resource;
    };
}

type TrackInput = {
    title: string | undefined;
    author: string | undefined;
    url: string;
    thumbnail: string;
    durationMs: number;
    requestedBy: string;
};
