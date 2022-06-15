import { moderation_type } from "@prisma/client";
import {
    HexColorString,
    EmbedBuilder,
    Util,
    ApplicationCommandOptionType,
    APIEmbedField,
} from "discord.js";
import stringDurationToMs from "../../lib/durationconvert";
import { failEmbedTemplate } from "../../lib/embedTemplate";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "warn",
            description: "warns a user",
            group: CommandGroup.moderation,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to warn",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "Reason why the user is getting warned",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "duration",
                    description:
                        "How long to keep the warn `0d0h`, default: forever",
                    required: false,
                },
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guild) throw "No guild on warn command";
        const db = msg.client.db;

        const target = msg.options.getUser("user", true);
        const duration = msg.options.getString("duration");
        let reason = msg.options.getString("reason", true);

        reason = Util.escapeMarkdown(reason).substring(0, 256);

        const failEmbed = failEmbedTemplate();

        if (target.bot) {
            const response = failEmbed.setDescription("You can't warn bots");
            return { embeds: [response] };
        }

        // Expiry
        let expiry: Date | undefined = undefined;
        const durationMs = duration ? stringDurationToMs(duration) : 0;
        if (durationMs !== 0) {
            expiry = new Date(Date.now() + durationMs);
        }

        await db.moderation_log
            .create({
                data: {
                    expiry,
                    reason: reason,
                    user: target.id,
                    moderator: msg.user.id,
                    guild_id: msg.guildId as string,
                    moderation_type: moderation_type.warn,
                },
            })
            .catch((e: Error) => {
                console.log(e);
                throw "couldnt create warn??";
            });

        const warnCount = await db.moderation_log.count({
            where: {
                user: target.id,
                guild_id: msg.guildId as string,
                moderation_type: moderation_type.warn,
                deleted: false,
                OR: [
                    { expiry: { equals: null } },
                    { expiry: { gt: new Date() } },
                ],
            },
        });

        let colour: HexColorString;

        switch (warnCount) {
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

        const fields: APIEmbedField[] = [
            {
                name: "Reason",
                value: `\`\`\`${reason}\`\`\``,
            },
        ];
        if (expiry)
            fields.push({
                name: "Expires",
                value: `<t:${Math.round(Number(expiry) / 1000)}:D>`,
                inline: true,
            });

        const embed = new EmbedBuilder();
        embed.setTitle(`You have been warned in "${msg.guild.name}"`);
        embed.setFields(fields);
        embed.setColor(colour);

        const dm = await target.send({ embeds: [embed] }).catch(() => null);

        embed.setTitle(
            `${target.username}#${target.discriminator} has been warned, ${warnCount} total`,
        );
        embed.addFields([
            {
                name: "Notified",
                value: dm ? "🟢 Yes" : "🔴 No",
                inline: true,
            },
        ]);

        return { embeds: [embed] };
    }
};
