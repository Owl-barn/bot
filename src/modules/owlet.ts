import WebSocket from "ws";
import wsRequest from "../types/wsRequest";

export default class Owlet {
    private id: string;
    private guilds: Map<string, Guild> = new Map();
    private socket: WebSocket;
    private promises: Map<
        string,
        Record<"resolve" | "reject", (x: any) => void>
    > = new Map();
    private eventCallbacks: Map<string, ((x: any) => void)[]> = new Map();

    constructor(id: string, socket: WebSocket, guilds: Guild[]) {
        this.id = id;
        this.socket = socket;
        this.socket.on("message", this.onMessage);
        guilds.forEach((guild) => this.guilds.set(guild.id, guild));
    }

    private onMessage = async (data: WebSocket.Data): Promise<void> => {
        let message;

        try {
            message = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        const promise = this.promises.get(message.mid);
        if (promise) {
            promise.resolve(message.data);
            this.promises.delete(message.mid);
        }

        const callbacks = this.eventCallbacks.get(message.command);

        if (callbacks != null && this.eventCallbacks.get(message.command)) {
            for (const callback of callbacks) {
                callback(message);
            }
        }
    };

    public on = (event: string, callback: (x: any) => void): void => {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)?.push(callback);
    };

    public getId = (): string => this.id;

    public getGuilds = (): Map<string, Guild> => this.guilds;

    public updateGuilds = (guilds: Guild[]): void => {
        console.log(`Updating guilds for ${this.id}`.yellow.bold);
        for (const guild of guilds) {
            this.guilds.set(guild.id, guild);
        }
    };

    public getGuild(id: string): Guild | undefined {
        return this.guilds.get(id);
    }

    /**
     * Sends a command to the owlet.
     * @param message message to send.
     * @returns promise of the owlet's response.
     */
    public async send<T>(message: wsRequest): Promise<T> {
        console.log("Sent".yellow.bold, message);

        this.socket.send(JSON.stringify(message));
        const result = new Promise<T>((resolve, reject) => {
            this.promises.set(message.mid, { resolve, reject });
            setTimeout(() => {
                reject("Timeout");
            }, 10000);
        });

        return await result;
    }
}

interface Guild {
    id: string;
    channelId: string;
}
