import colors from "colors";
import dotenv from "dotenv";
colors.enable();
dotenv.config();

import { Client, Intents } from "discord.js";
import RavenClient from "./types/ravenClient";
import { registerCommands } from "./modules/command.initializer";
import eventInitializer from "./modules/event.initializer";
import registerCommand from "./modules/command.register";

export default class Bot {

    client: RavenClient
    constructor() {
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] }) as RavenClient;

        this.initializeEvents();
        this.initializeCommands();
    }

    private initializeEvents() {
        eventInitializer(this.client);
    }

    private async initializeCommands() {
        this.client.commands = await registerCommands(this.client).catch((e) => { throw ` x Couldnt load commands \n ${e}`.red.bold; });
    }

    public async listen(): Promise<void> {
        const client = this.client;
        await client.login(process.env.DISCORD_TOKEN);
        if (!client.user) return;
        console.log(` ✓ Client ready, logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`.green.bold);

        // registerCommand(this.client.commands, "315428379316846592");
        // registerCommand(this.client.commands, "467011741738336258")
    }
}

const bot = new Bot();
bot.listen();