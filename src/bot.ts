import { GatewayIntentBits } from "discord.js";
import RavenClient from "./types/ravenClient";
import { registerCommands } from "./modules/command.initializer";
import eventInitializer from "./modules/event.initializer";
import musicService from "./modules/music.service";
import prisma from "./lib/db.service";
import birthdayCron from "./lib/birthday.cron";
import { registerButtons } from "./modules/button.initializer";
import AFKService from "./lib/afk.service";
import GuildConfig from "./lib/guildconfig.service";
import bannedUsers from "./lib/banlist.service";

class Bot {
    private client: RavenClient;

    constructor() {
        this.client = new RavenClient({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
            ],
            allowedMentions: { parse: ["users"] },
        });

        this.client.musicService = new musicService();

        this.init().then(() => this.listen());
    }

    private init = async () => {
        this.initializeDB();
        AFKService;
        GuildConfig.init();
        bannedUsers.init();
        birthdayCron.start();
        await eventInitializer(this.client);
        await this.initializeCommands();
        await this.initializeButtons();
    };

    private async initializeCommands() {
        this.client.commands = await registerCommands();
    }

    private async initializeButtons() {
        this.client.buttons = await registerButtons().catch((e) => {
            throw ` x Couldnt load buttons \n ${e}`.red.bold;
        });
    }

    private initializeDB() {
        this.client.db = prisma;
    }

    public getClient = (): RavenClient => {
        return this.client;
    };

    public async listen(): Promise<void> {
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}

declare const global: NodeJS.Global & { bot?: Bot };
const bot: Bot = global.bot || new Bot();
if (process.env.NODE_ENV === "development") global.bot = bot;

export default bot;
