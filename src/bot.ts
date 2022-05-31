import { Player } from "discord-player";
import Discord, { Intents, VoiceChannel } from "discord.js";
import Client from "./types/client";

import colors from "colors";
import dotenv from "dotenv";
colors.enable();
dotenv.config();

export default class Bot {
    client: Client;

    async start(token: string): Promise<Client> {
        this.client = await this.init();
        await this.client.login(token);
        console.log(`Logged in as ${this.client.user?.tag}`.green);
        return this.client;
    }

    public getClient() {
        return this.client;
    }

    private async init(): Promise<Client> {
        const client = new Discord.Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_VOICE_STATES,
            ],
        }) as Client;

        const player = new Player(client);
        client.player = player;
        return client;
    }
}
