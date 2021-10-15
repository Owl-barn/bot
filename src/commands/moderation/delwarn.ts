import { CommandInteraction, InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import RavenClient from "../../types/ravenClient";

export default class extends Command {
    constructor() {
        super({
            name: "delwarn",
            description: "Deletes a specific warn.",
            group: "moderator",

            guildOnly: true,
            adminOnly: false,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "which user's warning to remove.",
                    required: true,
                },
                {
                    type: argumentType.integer,
                    name: "index",
                    description: "which warning.",
                    required: true,
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

        const index = msg.options.get("index")?.value as number;
        const target = msg.options.get("user")?.user as User;


        if (index < 1) { return { content: "Invalid index" }; }

        const query = await db.warnings.findFirst({
            where: {
                target_id: target.id,
                guild_id: msg.guildId as string,
            },
            orderBy: { created: "asc" },
            skip: index - 1,
        });

        if (query === null) return { content: "Out of bounds." };

        await db.warnings.delete({ where: { uuid: query.uuid } });

        const embed = new MessageEmbed()
            .setAuthor(`${target.username}#${target.discriminator}'s ${index}${index > 1 ? "nd" : "st"} warning was removed`)
            .setColor(5362138);

        return { embeds: [embed] };
    }
}