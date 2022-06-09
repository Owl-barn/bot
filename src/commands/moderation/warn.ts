import { moderation_type } from "@prisma/client";
import {
    HexColorString,
    EmbedBuilder,
    Util,
    ApplicationCommandOptionType,
} from "discord.js";
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
            ],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const db = msg.client.db;

        const hidden = msg.options.getBoolean("hidden");
        const target = msg.options.getUser("user", true);
        let reason = msg.options.getString("reason", true);

        reason = Util.escapeMarkdown(reason).substring(0, 256);

        const failEmbed = failEmbedTemplate();

        if (target.bot) {
            const response = failEmbed.setDescription("You can't warn bots");
            return { embeds: [response] };
        }

        await db.moderation_log
            .create({
                data: {
                    user: target.id,
                    reason: reason,
                    guild_id: msg.guildId as string,
                    moderator: msg.user.id,
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

        const embed = new EmbedBuilder()
            .setTitle(
                `${target.username}#${target.discriminator} has been warned, ${warnCount} total`,
            )
            .setDescription(`**reason:** ${reason}`)
            .setColor(colour);

        return { embeds: [embed], content: hidden ? undefined : `${target}` };
    }
};
