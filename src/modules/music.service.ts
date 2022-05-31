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

    public onConnection = (socket: WS, request: IncomingMessage): void => {
        socket.on("message", (x) => this.onMessage(socket, x));
    };

    public onMessage = async (ws: WS, data: WS.Data): Promise<void> => {
        let message;

        try {
            message = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        console.log("Received:".green.bold, message);

        if (message.command == "Authenticate") {
            this.authenticate(ws, message);
            return;
        }

        if (message.command == "Status") {
            this.status(ws, message);
            return;
        }
    };

    private async authenticate(ws: WS, message: wsResponse): Promise<void> {
        const pass = message.data.password;
        if (pass != "1234") {
            ws.send(JSON.stringify({ mid: message.mid, success: false }));
            return;
        }

        const response = {
            command: "Authenticated",
            mid: message.mid,
            success: true,
            token: owlets[0],
        };

        console.log(`Authenticated an Owlet`);

        ws.send(JSON.stringify(response));
    }

    private async status(ws: WS, message: wsResponse): Promise<void> {
        const data = message.data as unknown as status;
        const bot = this.bots.get(data.id);
        if (!bot) this.bots.set(data.id, new Owlet(data.id, ws, data.guilds));
        else bot.updateGuilds(data.guilds);
    }

    public updateBot(bot: Owlet): void {
        this.bots.set(bot.getId(), bot);
    }

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
