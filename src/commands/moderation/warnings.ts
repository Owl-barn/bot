import { HexColorString, InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import { argumentType } from "../../types/argument";
import { Command } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "warnings",
            description: "shows a user's warnings",
            group: CommandGroup.moderation,

            guildOnly: true,

            args: [
                {
                    type: argumentType.user,
                    name: "user",
                    description: "which user's warnings to display.",
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

        const target = msg.options.getUser("user") as User;

        const warnings = await db.warnings.findMany({
            where: {
                target_id: target.id,
                guild_id: msg.guildId as string,
            },
            orderBy: {
                created: "asc",
            },
        });

        const warns = warnings.map((warning, x) => ({
            name: `#${x + 1}`,
            value: `
                **mod:** <@!${warning.mod_id}>
                **reason:** ${warning.reason}
                **Date:** <t:${Number(warning.created) / 1000}:R>
                `,
        }));

        let colour: HexColorString;

        switch (warns.length) {
            case 0: colour = process.env.EMBED_COLOR as HexColorString; break;
            case 1: colour = "#18ac15"; break;
            case 2: colour = "#d7b500"; break;
            default: colour = "#e60008"; break;
        }

        const embed = new MessageEmbed()
            .setAuthor({ name: `${target.tag} has ${warnings.length} warnings.`, iconURL: target.avatarURL() as string })
            .setColor(colour);

        warns.length !== 0 ? embed.addFields(warns) : embed.setDescription("This user has no warnings.");

        return { embeds: [embed] };
    }
};