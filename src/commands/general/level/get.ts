import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { failEmbedTemplate, embedTemplate } from "../../../lib/embedTemplate";
import formatNumber from "../../../lib/formatNumber";
import GuildConfig from "../../../lib/guildconfig.service";
import levelService from "../../../lib/level.service";
import progressBar from "../../../lib/progressBar";
import { Command, returnMessage } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "get",
            description: "Get your own or your friends current level!",

            args: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "user",
                    description: "The user to get the level of.",
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
        const member =
            (msg.options.getMember("user") as GuildMember | null) ||
            (msg.member as GuildMember);
        if (!msg.guildId) throw "Level Command didnt get guildID";
        const failEmbed = failEmbedTemplate();
        const embed = embedTemplate();

        if (member.user.bot) {
            const response = failEmbed.setDescription("Bots cant have levels.");
            return { embeds: [response] };
        }

        const config = GuildConfig.getGuild(msg.guildId);
        if (!config || !config.levelEnabled) {
            const response = failEmbed.setDescription(
                "Leveling is not enabled on this server.",
            );
            return { embeds: [response] };
        }

        let level = await msg.client.db.level.findUnique({
            where: {
                user_id_guild_id: {
                    guild_id: msg.guildId,
                    user_id: member.id,
                },
            },
        });

        if (!level) {
            level = await msg.client.db.level.create({
                data: {
                    user_id: member.id,
                    guild_id: msg.guildId,
                },
            });
        }

        const rank = await msg.client.db.level.aggregate({
            _count: { user_id: true },
            where: {
                experience: { gt: level.experience },
                guild_id: msg.guildId,
            },
        });

        rank._count.user_id += 1;
        const stats = levelService.calculateLevel(level.experience);

        const NextReward = await msg.client.db.level_reward.findFirst({
            where: {
                guild_id: msg.guildId,
                level: { gt: stats.level },
            },
            orderBy: { level: "asc" },
        });

        const theme = {
            start: "[",
            end: "]",
            passed: "=",
            remaining: "-",
            indicator: ">",
        };

        const progress = progressBar(
            stats.currentXP / stats.levelXP,
            30,
            theme,
        );
        const remaining = stats.levelXP - stats.currentXP;

        embed.setTitle(`${member.user.username}'s level`);
        embed.setThumbnail(
            member.avatarURL() ||
                member.user.avatarURL() ||
                member.user.defaultAvatarURL,
        );

        embed.setDescription(
            `**Level:** ${stats.level}\n` +
                `**Rank:** #${rank._count.user_id}\n` +
                `**Total XP:** ${formatNumber(stats.totalXP)}\n` +
                `\`\`\`${stats.level}${progress}${stats.level + 1}\`\`\``,
        );
        embed.addFields([
            {
                name: "Next level",
                value:
                    `**XP gained:** ${formatNumber(stats.currentXP)}\n` +
                    `**XP needed:** ${formatNumber(stats.levelXP)}`,
                inline: true,
            },
            {
                name: "Needed to level up",
                value:
                    `**XP:** ${formatNumber(remaining)}\n` +
                    `**Msg:** ~${formatNumber(Math.round(remaining / 20))}`,
                inline: true,
            },
        ]);

        if (NextReward) {
            embed.addFields([
                {
                    name: "Next reward",
                    value:
                        `**Level:** ${NextReward.level}\n` +
                        `**Role:** <@&${NextReward.role_id}>`,
                    inline: true,
                },
            ]);
        }

        return { embeds: [embed] };
    }
};
