import Discord, { GatewayIntentBits } from "discord.js";
import Client from "./types/client";

import colors from "colors";
import dotenv from "dotenv";
import MusicPlayer from "./music/manager";
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
            intents:
                GatewayIntentBits.Guilds | GatewayIntentBits.GuildVoiceStates,
        }) as Client;

        client.player = new MusicPlayer();
        return client;
    }
}
