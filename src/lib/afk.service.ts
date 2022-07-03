import { afk } from "@prisma/client";
import { Message } from "discord.js";
import env from "../modules/env";
import db from "./db.service";
import { embedTemplate } from "./embedTemplate";

class AFKServiceClass {
    private globals: Set<string> = new Set();
    private guilds: Set<string> = new Set();

    constructor() {
        this.initialize();
    }

    public setAFK(input: afk): void {
        if (input.global) this.globals.add(input.user_id);
        else this.guilds.add(`${input.user_id}-${input.guild_id}`);
    }

    public onMessage = async (msg: Message): Promise<void> => {
        let removeAFK = false;
        const guildString = `${msg.author.id}-${msg.guildId}`;
        // Is this user AFK?
        if (this.globals.has(msg.author.id) || this.guilds.has(guildString)) {
            await db.afk.deleteMany({
                where: {
                    OR: [
                        {
                            user_id: msg.author.id,
                            guild_id: msg.guildId as string,
                        },
                        { user_id: msg.author.id, global: true },
                    ],
                },
            });

            this.globals.delete(msg.author.id);
            this.guilds.delete(guildString);

            removeAFK = true;
        }

        // Check if pinged AFk user.
        const mentions = msg.mentions.users;
        const AFKPeople: Record<string, unknown>[] = [];
        if (mentions.size == 0) {
            if (removeAFK)
                await msg.reply({ content: "Successfully removed your afk!" });
            return;
        }

        let AFKString = "";
        mentions.forEach((mention) => {
            if (AFKPeople.length >= 3) return;
            if (mention.id == msg.author.id) return;
            if (this.guilds.has(`${mention.id}-${msg.guildId}`)) {
                AFKPeople.push({ user_id: mention.id, guild_id: msg.guildId });
                return;
            }
            if (this.globals.has(mention.id))
                AFKPeople.push({ user_id: mention.id, global: true });
        });

        if (AFKPeople.length == 0) return;

        const afks = await db.afk.findMany({ where: { OR: AFKPeople } });
        for (const x of afks)
            AFKString += `\n<@${x.user_id}> went afk <t:${
                Number(x.created) / 1000
            }:R>${x.reason ? ` with the reason: \`\`${x.reason}\`\`` : ""}`;

        const embed = embedTemplate();
        embed.setDescription(AFKString);
        if (removeAFK) embed.setTitle("Removed your AFK!");
        await msg.reply({ embeds: [embed] });
    };

    public initialize = async (): Promise<void> => {
        const afks = await db.afk.findMany();

        this.globals = new Set();
        this.guilds = new Set();

        for (const x of afks) this.setAFK(x);
        console.log(`AFK service initialized, ${afks.length} users`);
    };
}

declare const global: NodeJS.Global & { AFKService: AFKServiceClass };
const AFKService: AFKServiceClass = global.AFKService || new AFKServiceClass();
if (env.isDevelopment) global.AFKService = AFKService;

export default AFKService;
