import { Intents, Snowflake } from "discord.js";
import RavenClient from "./types/ravenClient";
import { registerCommands } from "./modules/command.initializer";
import eventInitializer from "./modules/event.initializer";
import musicService from "./modules/music.service";
import prisma from "./lib/db.service";
import birthdayCron from "./lib/birthday.cron";

export default class Bot {
    private client: RavenClient;


    constructor() {
        this.client = new RavenClient({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES], allowedMentions: { parse: ["users"] } });
        this.client.musicService = new Map<Snowflake, musicService>();

        this.initializeEvents();
        this.initializeCommands();
        this.initializeDB();
        birthdayCron.start();

        this.listen();
    }

    private initializeEvents() {
        eventInitializer(this.client);
    }

    private async initializeCommands() {
        this.client.commands = await registerCommands().catch((e) => { throw ` x Couldnt load commands \n ${e}`.red.bold; });
    }

    private initializeDB() {
        this.client.db = prisma;
    }

    public getClient = (): RavenClient => {
        return this.client;
    }

    public async listen(): Promise<void> {
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}