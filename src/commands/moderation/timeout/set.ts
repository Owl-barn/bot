import { moderation_type } from "@prisma/client";
import { ApplicationCommandOptionType, GuildMember, Util } from "discord.js";
import stringDurationToMs, { msToString } from "../../../lib/durationconvert";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { getAvatar } from "../../../lib/functions";
import GuildConfig from "../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
    constructor() {
        super({
            name: "set",
            description: "Set a timeout for a user",

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to put on timeout",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "duration",
                    description: "for how long",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "why?",
                    required: false,
                },
            ],

            botPermissions: ["ModerateMembers"],

            throttling: {
                duration: 60,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guild) throw "No guild on timeout command";
        const timeoutLimit = 2419200000;

        let reason = msg.options.getString("reason", false);
        const duration = msg.options.getString("duration", true);
        const target = msg.options.getMember("user") as GuildMember | null;

        if (!target) return { content: "No user provided" };

        const embed = embedTemplate();
        const failEmbed = failEmbedTemplate();

        const guildInfo = GuildConfig.getGuild(msg.guild.id);
        const isStaff =
            guildInfo?.staff_role &&
            target.roles.cache.get(guildInfo.staff_role);

        if (!target.moderatable || isStaff)
            return {
                embeds: [failEmbed.setDescription("I cant time-out that user")],
            };

        let durationMs = stringDurationToMs(duration);

        if (durationMs < 10 * 1000) durationMs = 60 * 1000;

        if (durationMs > timeoutLimit) durationMs = timeoutLimit;

        reason = reason
            ? Util.escapeMarkdown(reason).substring(0, 127)
            : "No reason provided.";

        const member = await target.timeout(durationMs, reason);

        if (!member.communicationDisabledUntilTimestamp) throw "??";

        const durationString = msToString(durationMs);

        embed.setTitle(`You have been timed out in "${msg.guild.name}"`);
        embed.addFields([
            {
                name: "Reason",
                value: `\`\`\`${reason}\`\`\``,
            },
            {
                name: "Duration",
                value: durationString,
                inline: true,
            },
            {
                name: "Expiration",
                value: `<t:${Math.round(
                    member.communicationDisabledUntilTimestamp / 1000,
                )}:R> `,
                inline: true,
            },
        ]);

        const dm = await target.send({ embeds: [embed] }).catch(() => null);

        const avatar = getAvatar(target);

        embed.setTitle("Timeout Set");
        embed.setFooter({
            text: `${target.user.tag} <@${target.id}>`,
            iconURL: avatar,
        });
        embed.addFields([
            {
                name: "Notified",
                value: dm ? "🟢 Yes" : "🔴 No",
                inline: true,
            },
        ]);

        await msg.client.db.moderation_log.create({
            data: {
                expiry: new Date(Date.now() + durationMs),
                reason,
                user: target.id,
                moderator: msg.user.id,
                guild_id: msg.guildId as string,
                moderation_type: moderation_type.timeout,
            },
        });

        return { embeds: [embed] };
    }
};
