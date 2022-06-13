import { moderation_type } from "@prisma/client";
import { GuildMember, Util, ApplicationCommandOptionType } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import GuildConfig from "../../lib/guildconfig.service";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "kick",
            description: "kicks a user",
            group: CommandGroup.moderation,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to kick",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "Reason why the user is getting kicked",
                    required: true,
                },
            ],

            botPermissions: ["KickMembers"],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild on kick??";

        let reason = msg.options.getString("reason");
        const target = msg.options.getMember("user") as GuildMember | null;

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        reason = reason
            ? Util.escapeMarkdown(reason).substring(0, 256)
            : "No reason provided";

        if (!target)
            return { embeds: [failEmbed.setDescription("No user provided")] };

        const guildInfo = GuildConfig.getGuild(msg.guildId);
        const isStaff =
            guildInfo?.staff_role &&
            target.roles.cache.get(guildInfo.staff_role);

        if (!target.kickable || isStaff)
            return {
                ephemeral: true,
                embeds: [failEmbed.setDescription("I cant kick that person")],
            };

        await target.kick(reason.substring(0, 128));

        embed.setTitle(`User has been kicked`);
        embed.setDescription(
            `<@${
                target.id
            }> has been kicked with the reason: \`${Util.escapeMarkdown(
                reason,
            )}\``,
        );

        await msg.client.db.moderation_log.create({
            data: {
                user: target.id,
                reason: reason,
                guild_id: msg.guildId as string,
                moderator: msg.user.id,
                moderation_type: moderation_type.kick,
            },
        });

        return { embeds: [embed] };
    }
};
