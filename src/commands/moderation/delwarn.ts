import {
    HexColorString,
    InteractionReplyOptions,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from "discord.js";
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

        const failEmbed = new EmbedBuilder().setColor(
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

        const embed = new EmbedBuilder()
            .setTitle(
                `${target.username}#${target.discriminator}'s ${index}${
                    index > 1 ? "nd" : "st"
                } warning was removed`,
            )
            .setColor(process.env.EMBED_COLOR as HexColorString);

        return { embeds: [embed] };
    }
}
