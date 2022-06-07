import { GuildMember, Util, ApplicationCommandOptionType } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import GuildConfig from "../../lib/guildconfig.service";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "ban",
            description: "bans a user",
            group: CommandGroup.moderation,

            guildOnly: true,

            arguments: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "User to ban",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "reason",
                    description: "Reason why the user is getting banned",
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "days",
                    description: "Number of days to delete messages",
                    required: false,
                },
            ],

            botPermissions: ["BanMembers"],

            throttling: {
                duration: 30,
                usages: 3,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        if (!msg.guildId) throw "No guild on ban??";
        let reason = msg.options.getString("reason");
        const days = msg.options.getInteger("days") ?? 0;
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

        if (!target.bannable || isStaff)
            return {
                ephemeral: true,
                embeds: [failEmbed.setDescription("I cant ban that person")],
            };

        target.ban({
            reason: reason.substring(0, 128),
            deleteMessageDays: days,
        });

        embed.setTitle(`User has been banned`);
        embed.setDescription(
            `<@${
                target.id
            }> has been banned with the reason: \`${Util.escapeMarkdown(
                reason,
            )}\``,
        );

        return { embeds: [embed] };
    }
};
