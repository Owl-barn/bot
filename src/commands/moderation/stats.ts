import { logs_eventType } from ".prisma/client";
import { CommandInteraction, InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenClient from "../../types/ravenClient";

module.exports = class extends Command {
    constructor() {
        super({
            name: "modstats",
            description: "shows mod stats",
            group: "moderator",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "which user's modstats",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: CommandInteraction): Promise<InteractionReplyOptions> {
        const db = (msg.client as RavenClient).db;

        const target = msg.options.get("user")?.user as User;

        const count = await db.logs.count({ where: { guild_id: msg.guildId as string, event_type: logs_eventType.warn } });
        console.log(count);

        // make embed.
        const embed = new MessageEmbed()
            .setDescription("a");

        // send embed.
        return { embeds: [embed] };
    }
};