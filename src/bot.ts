import colors from "colors";
import dotenv from "dotenv";
colors.enable();
dotenv.config();

import { Client, Intents, Snowflake } from "discord.js";
import RavenClient from "./types/ravenClient";
import { registerCommands } from "./modules/command.initializer";
import eventInitializer from "./modules/event.initializer";
import { PrismaClient } from "@prisma/client";
import musicService from "./modules/music.service";
import registerCommand from "./modules/command.register";

export default class Bot {

    client: RavenClient;
    db: PrismaClient;


    constructor() {
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES], allowedMentions: { parse: ["everyone", "roles"] } }) as RavenClient;
        this.client.musicService = new Map<Snowflake, musicService>();

        this.initializeEvents();
        this.initializeCommands();
        this.initializeDB();
    }

    private initializeEvents() {
        eventInitializer(this.client);
    }

    private async initializeCommands() {
        this.client.commands = await registerCommands().catch((e) => { throw ` x Couldnt load commands \n ${e}`.red.bold; });
    }

    private initializeDB() {
        this.db = new PrismaClient();
        this.client.db = this.db;
    }

    public async listen(): Promise<void> {
        await this.client.login(process.env.DISCORD_TOKEN);

        // registerCommand(this.client.commands, this.client.user.id, "315428379316846592");
    }
}