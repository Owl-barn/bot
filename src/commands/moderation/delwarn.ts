import {
    HexColorString,
    InteractionReplyOptions,
    MessageEmbed,
} from "discord.js";
import { argumentType } from "../../types/argument";
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

    async execute(msg: RavenInteraction): Promise<InteractionReplyOptions> {
        const db = msg.client.db;

        const index = msg.options.getInteger("index", true);
        const target = msg.options.getUser("user", true);

        const failEmbed = new MessageEmbed().setColor(
            process.env.EMBED_FAIL_COLOR as HexColorString,
        );

        if (index < 1)
            return { embeds: [failEmbed.setDescription("Invalid index")] };

        const query = await db.warnings.findFirst({
            where: {
                target_id: target.id,
                guild_id: msg.guildId as string,
            },
            orderBy: { created: "asc" },
            skip: index - 1,
        });

        if (query === null)
            return { embeds: [failEmbed.setDescription("Out of bounds.")] };

        await db.warnings.delete({ where: { uuid: query.uuid } });

        const embed = new MessageEmbed()
            .setTitle(
                `${target.username}#${target.discriminator}'s ${index}${
                    index > 1 ? "nd" : "st"
                } warning was removed`,
            )
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
}
