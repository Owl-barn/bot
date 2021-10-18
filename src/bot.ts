import { Client, Intents, Snowflake } from "discord.js";
import RavenClient from "./types/ravenClient";
import { registerCommands } from "./modules/command.initializer";
import eventInitializer from "./modules/event.initializer";
import musicService from "./modules/music.service";
import registerCommand from "./modules/command.register";
import prisma from "./lib/db.service";

export default class Bot {
    private client: RavenClient;


    constructor() {
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES], allowedMentions: { parse: ["everyone", "roles"] } }) as RavenClient;
        this.client.musicService = new Map<Snowflake, musicService>();

        this.initializeEvents();
        this.initializeCommands();
        this.initializeDB();

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

        // registerCommand(this.client.commands, this.client.user.id, "315428379316846592");
    }
}