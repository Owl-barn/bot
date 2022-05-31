import WebSocket from "ws";
import RavenInteraction from "../types/interaction";
import Queue from "../types/queue";
import { QueueInfo } from "../types/queueInfo";
import Track from "../types/track";
import wsRequest from "../types/wsRequest";
import wsResponse from "../types/wsResponse";

export default class Owlet {
    private id: string;
    private guilds: Map<string, Guild> = new Map();
    private socket: WebSocket;
    private promises: Map<string, Record<string, (x: any) => void>> = new Map();

    constructor(id: string, socket: WebSocket, guilds: Guild[]) {
        this.id = id;
        this.socket = socket;
        this.socket.on("message", this.onMessage);
        guilds.forEach((guild) => this.guilds.set(guild.id, guild));
        console.log(`Owlet ${id} connected`);
    }

    private onMessage = async (data: WebSocket.Data): Promise<void> => {
        let message;

        try {
            message = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        console.log(message);

        const promise = this.promises.get(message.mid);
        if (promise) promise.resolve(message);
    };

    public getId = (): string => this.id;

    public getGuilds = (): Map<string, Guild> => this.guilds;

    public updateGuilds = (guilds: Guild[]): void => {
        guilds.forEach((guild) => this.guilds.set(guild.id, guild));
    };

    public getGuild(id: string): Guild | undefined {
        return this.guilds.get(id);
    }

    public async send<T>(message: wsRequest): Promise<T> {
        console.log("Sent".yellow.bold + `${message}`);

        this.socket.send(JSON.stringify(message));
        const a = new Promise<T>((resolve, reject) => {
            this.promises.set(message.mid, { resolve, reject });
            setTimeout(() => {
                reject("Timeout");
            }, 10000);
        });

        return await a;
    }

    public stop = async (msg: RavenInteraction): Promise<wsResponse> => {
        const response = {
            mid: msg.id,
            command: "Stop",
            data: {
                guildId: msg.guildId,
            },
        };

        return await this.send(response);
    };

    public pause = async (msg: RavenInteraction): Promise<wsResponse> => {
        const response = {
            mid: msg.id,
            command: "Pause",
            data: {
                guildId: msg.guildId,
            },
        };

        return await this.send(response);
    };

    public getQueue = async (
        msg: RavenInteraction,
    ): Promise<wsResponse & { data: Queue }> => {
        const response = {
            mid: msg.id,
            command: "Queue",
            data: {
                guildId: msg.guildId,
            },
        };

        return await this.send(response);
    };

    public getCurrentTrack = async (
        msg: RavenInteraction,
    ): Promise<wsResponse & { data: { current: Track } }> => {
        const response = await this.getQueue(msg);
        return { ...response, data: { current: response.data.queue[0] } };
    };

    public loop = async (
        msg: RavenInteraction,
        loop: boolean,
    ): Promise<wsResponse> => {
        const response = {
            mid: msg.id,
            command: "Play",
            data: {
                guildId: msg.guildId,
                loop,
            },
        };

        return await this.send(response);
    };

    public play = async (
        msg: RavenInteraction,
        channelId: string,
        query: string,
        force: boolean,
    ): Promise<playResponse> => {
        const response = {
            mid: msg.id,
            command: "Play",
            data: {
                guildId: msg.guildId,
                channelId,
                userId: msg.user.id,
                query,
                force,
            },
        };

        return await this.send(response);
    };
}

interface Guild {
    id: string;
    channelId: string;
}

interface playResponse extends wsResponse {
    data: {
        error?: string;
        track: Track;
        queueInfo: QueueInfo;
    };
}
