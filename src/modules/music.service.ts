import { Snowflake } from "discord.js";
import Owlet from "./owlet";
import wsResponse from "../types/wsResponse";
import WS from "ws";
import { IncomingMessage } from "http";
import owlets from "../owlets.json";

export default class musicService {
    private bots: Map<string, Owlet> = new Map();
    private wss: WS.Server;

    constructor() {
        this.wss = new WS.Server({ port: 8080 });
        this.wss.on("connection", this.onConnection);
    }

    private onConnection = (socket: WS, _request: IncomingMessage): void => {
        socket.on("message", (x) => this.onMessage(socket, x));
    };

    private onMessage = async (ws: WS, data: WS.Data): Promise<void> => {
        let message;

        try {
            message = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        if (process.env.NODE_ENV == "development")
            console.log("Received:".yellow.bold, message);

        switch (message.command) {
            case "Authenticate":
                this.authenticate(ws, message);
                break;
            case "Status":
                this.status(ws, message);
                break;
        }
    };

    /**
     * broadcasts a message to all owlets.
     * @param data message to send
     */
    public broadcast(data: apiRequest): void {
        this.wss.clients.forEach((ws) => ws.send(JSON.stringify(data)));
    }

    public terminate(): number {
        const request = {
            command: "Terminate",
            mid: "massTerminate",
            data: {},
        };

        const botCount = this.bots.size;

        this.broadcast(request);

        return botCount;
    }

    /**
     * Returns the first unused bot account.
     * @returns Owlet credentials.
     */
    private async getCredentials() {
        const credentialList = owlets;
        for (const credential of credentialList) {
            if (this.bots.has(credential.id)) continue;
            return credential;
        }
        return undefined;
    }

    /**
     * Remove the bot from the list.
     * @param id bot id.
     */
    private removeBot(id: string) {
        this.bots.delete(id);
        console.log(
            `Owlet disconnected <@${id}>, ${this.bots.size} active.`.red.bold,
        );
    }
    /**
     * Authenticates the owlet.
     */
    private async authenticate(ws: WS, message: apiRequest): Promise<void> {
        const pass = message.data.password;

        // Check password.
        if (pass != process.env.OWLET_PASSWORD) {
            return ws.send(
                JSON.stringify({
                    mid: message.mid,
                    error: "incorrect password",
                }),
            );
        }

        // Check if bot is reconnecting.
        const botToken = message.data.token as string | undefined;
        if (botToken) {
            const owletInfo = owlets.find((x) => x.token == botToken);

            // Bot account not in list.
            if (!owletInfo) {
                return ws.send(
                    JSON.stringify({
                        mid: message.mid,
                        error: "No bot account with that id in the system.",
                    }),
                );
            }

            // Bot account already active.
            if (this.bots.get(owletInfo.id)) {
                return ws.send(
                    JSON.stringify({
                        mid: message.mid,
                        error: "bot account already in use",
                    }),
                );
            }

            // return success.
            const response = {
                command: "Authenticate",
                mid: message.mid,
                data: {
                    token: owletInfo.token,
                },
            };

            // Add bot to the list.
            this.bots.set(owletInfo.id, new Owlet(owletInfo.id, ws, []));

            // If the bot disconnects remove it from the list.
            ws.on("close", () => this.removeBot(owletInfo.id));

            console.log(
                `Owlet authenticated <@${owletInfo.id}>, ${this.bots.size} active`
                    .green.bold,
            );

            ws.send(JSON.stringify(response));

            return;
        }

        // Get credentials.
        const credentials = await this.getCredentials();

        if (!credentials) {
            return ws.send(
                JSON.stringify({
                    mid: message.mid,
                    error: "No bot accounts left",
                }),
            );
        }

        // return success.
        const response = {
            command: "Authenticate",
            mid: message.mid,
            token: credentials.token,
        };

        // Add bot to the list.
        this.bots.set(credentials.id, new Owlet(credentials.id, ws, []));

        // If the bot disconnects remove it from the list.
        ws.on("close", () => this.removeBot(credentials.id));

        console.log(
            `Owlet authenticated <@${credentials.id}>, ${this.bots.size} active`
                .green.bold,
        );

        ws.send(JSON.stringify(response));
    }

    /**
     * Updates the current status of the owlet.
     * @param ws websocket
     * @param message message
     * @returns nothing
     */
    private async status(ws: WS, message: wsResponse): Promise<void> {
        const data = message.data as unknown as status;
        const bot = this.bots.get(data.id);

        if (!bot) {
            return ws.send(
                JSON.stringify({
                    mid: message.mid,
                    error: "bot not found",
                }),
            );
        }

        bot.updateGuilds(data.guilds);
    }

    public getBots = (): Map<string, Owlet> => this.bots;

    /**
     * Returns the Owlet by the given id.
     */
    public getBotById = (botId: string): Owlet | undefined =>
        this.bots.get(botId);

    /**
     * Returns the Owlet currently connected to that channel or an available one
     * otherwise undefined
     */
    public getBot = (
        channelId: Snowflake,
        guildId: Snowflake,
    ): Owlet | undefined => {
        // search for a bot in that channel
        for (const bot of this.bots.values()) {
            for (const guild of bot.getGuilds().values()) {
                if (guild.channelId === channelId) {
                    return bot;
                }
            }
        }

        // otherwise, search for available bot
        for (const bot of this.bots.values()) {
            for (const guild of bot.getGuilds().values()) {
                if (guild.id === guildId && !guild.channelId) {
                    return bot;
                }
            }
        }

        // return undefined if no bot is available.
        return undefined;
    };
}

interface status {
    id: string;
    uptime: number;
    guilds: { id: string; channelId: string }[];
}

interface apiRequest {
    command: string;
    mid: string;
    data: any;
}
