import {
    InteractionReplyOptions,
    ApplicationCommandOptionType,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

export default class extends Command {
    constructor() {
        super({
            name: "delwarn",
            description: "Deletes a specific warn.",
            group: CommandGroup.moderation,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "which user's warning to remove.",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "index",
                    description: "which warning.",
                    min: 0,
                    required: true,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const db = msg.client.db;

        const index = msg.options.getInteger("index", true);
        const target = msg.options.getUser("user", true);

        const failEmbed = failEmbedTemplate();
        const embed = embedTemplate();

        if (index < 1)
            return { embeds: [failEmbed.setDescription("Invalid index")] };

        const query = await db.warnings.findFirst({
            orderBy: { created: "asc" },
            skip: index - 1,
            where: {
                target_id: target.id,
                guild_id: msg.guildId as string,
            },
        });

        if (query === null)
            return { embeds: [failEmbed.setDescription("Out of bounds.")] };

        await db.warnings.delete({ where: { uuid: query.uuid } });

        embed.setTitle(
            `${target.username}#${target.discriminator}'s ${index}${
                index > 1 ? "nd" : "st"
            } warning was removed`,
        );

        return { embeds: [embed] };
    }
}
