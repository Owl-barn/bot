import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    HexColorString,
} from "discord.js";
import { failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "get",
            description: "View the infractions a user has had.",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to view infractions for",
                    required: false,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        let target = msg.options.getUser("user");
        target = target ?? msg.user;

        const failEmbed = failEmbedTemplate();

        if (!target)
            return { embeds: [failEmbed.setDescription("No user provided")] };

        const logs = await msg.client.db.moderation_log.findMany({
            where: { user: target.id, guild_id: msg.guildId as string },
            orderBy: {
                created: "asc",
            },
        });

        const logList = logs.map((log, x) => ({
            name: `#${x + 1}`,
            value:
                `**ID:** \`${log.uuid}\`\n` +
                `**type:** \`${log.moderation_type}\`\n` +
                `**mod:** <@!${log.moderator}>\n` +
                `**reason:** *${log.reason}*\n` +
                `**Date:** <t:${Number(log.created) / 1000}:R>`,
        }));

        let colour: HexColorString;

        switch (logList.length) {
            case 0:
                colour = process.env.EMBED_COLOR as HexColorString;
                break;
            case 1:
                colour = "#18ac15";
                break;
            case 2:
                colour = "#d7b500";
                break;
            default:
                colour = "#e60008";
                break;
        }

        const embed = new EmbedBuilder();
        embed.setAuthor({
            name: `${target.tag} has ${logs.length} infractions.`,
            iconURL: target.avatarURL() as string,
        });
        embed.setColor(colour);

        logList.length !== 0
            ? embed.addFields(logList)
            : embed.setDescription("This user has no infractions.");

        return { embeds: [embed] };
    }
};
