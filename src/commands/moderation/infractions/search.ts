import { moderation_type } from "@prisma/client";
import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "search",
            description: "Search for specific moderation logs.",

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "query",
                    description: "Search all logs with a query",
                    required: false,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "event_type",
                    description: "What type of moderation log to search for",
                    required: false,
                    choices: [
                        { name: "ban", value: "ban" },
                        { name: "kick", value: "kick" },
                        { name: "warn", value: "ban" },
                        { name: "timeout", value: "timeout" },
                    ],
                },
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to view logs for",
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
        const user = msg.options.getUser("user");
        const query = msg.options.getString("query");
        const type = msg.options.getString("event_type");

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        if (!query && !type && !user) {
            const response = failEmbed.setDescription(
                "You need to fill in atleast 1 of the fields",
            );
            return { embeds: [response] };
        }

        const logs = await msg.client.db.moderation_log.findMany({
            where: {
                guild_id: msg.guildId as string,
                AND: [
                    { reason: { contains: query ?? undefined } },
                    {
                        moderation_type: type
                            ? (type as moderation_type)
                            : undefined,
                    },
                    {
                        OR: [
                            { user: user ? user.id : undefined },
                            { moderator: user ? user.id : undefined },
                        ],
                    },
                ],
            },
            orderBy: {
                created: "asc",
            },
            take: 20,
        });

        const logList = logs.map((log, index) => ({
            name: `#${index + 1}`,
            value:
                `**ID:** \`${log.uuid}\`\n` +
                `**type:** \`${log.moderation_type}\`\n` +
                `**user:** <@!${log.user}>\n` +
                `**mod:** <@!${log.moderator}>\n` +
                `**reason:** *${log.reason}*\n` +
                `**Date:** <t:${Number(log.created) / 1000}:R>`,
        }));

        logList.length !== 0
            ? embed.addFields(logList)
            : embed.setDescription("No results found");

        embed.setTitle("Search results:");

        return { embeds: [embed] };
    }
};
