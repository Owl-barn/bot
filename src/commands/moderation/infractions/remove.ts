import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { SubCommand, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "remove",
            description: "Remove an infraction from the moderation logs.",

            arguments: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "infraction_id",
                    description: "The ID of the infraction to remove",
                    required: true,
                },
            ],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const db = msg.client.db;
        const uuid = msg.options.getString("infraction_id", true);

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const RegExp =
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gm;
        if (!RegExp.test(uuid)) {
            const response = failEmbed.setDescription(
                "Invalid infraction ID provided",
            );
            return { embeds: [response] };
        }

        const infraction = await db.moderation_log
            .delete({
                where: {
                    guild_id_uuid: { uuid, guild_id: msg.guildId as string },
                },
            })
            .catch((e) => {
                console.log(e);
                return null;
            });

        if (!infraction) {
            const response = failEmbed.setDescription(
                "That infraction does not exist",
            );
            return { embeds: [response] };
        }

        embed.setTitle("Infraction Removed");
        embed.setDescription(
            `**ID:** \`${infraction.uuid}\`\n` +
                `**type:** \`${infraction.moderation_type}\`\n` +
                `**user:** <@!${infraction.user}>\n` +
                `**mod:** <@!${infraction.moderator}>\n` +
                `**reason:** *${infraction.reason}*\n` +
                `**Date:** <t:${Number(infraction.created) / 1000}:R>`,
        );
        return { embeds: [embed] };
    }
};
