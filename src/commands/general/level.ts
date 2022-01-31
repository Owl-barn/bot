import { GuildMember, HexColorString, MessageEmbed } from "discord.js";
import levelService from "../../lib/level.service";
import { argumentType } from "../../types/argument";
import { Command, returnMessage } from "../../types/Command";
import { CommandGroup } from "../../types/commandGroup";
import RavenInteraction from "../../types/interaction";

module.exports = class extends Command {
    constructor() {
        super({
            name: "level",
            description: "see level info.",
            group: CommandGroup.general,

            guildOnly: true,

            args: [
                {
                    type: argumentType.subCommand,
                    name: "get",
                    description: "Get your or someone else's level.",
                    subCommands: [
                        {
                            type: argumentType.user,
                            name: "user",
                            description: "whose level",
                            required: false,
                        },
                    ],
                },
                {
                    type: argumentType.subCommand,
                    name: "top",
                    description: "See the leaderboard.",
                },
            ],

            throttling: {
                duration: 60,
                usages: 60,
            },
        });
    }

    async execute(msg: RavenInteraction): Promise<returnMessage> {
        const subCommand = msg.options.getSubcommand(true);
        const user = msg.options.getUser("user") || msg.user;
        if (!msg.guildId) throw "a";
        const guild = await msg.client.db.guilds.findUnique({ where: { guild_id: msg.guildId } });

        const failEmbed = new MessageEmbed()
            .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

        const embed = new MessageEmbed()
            .setColor(process.env.EMBED_COLOR as HexColorString);

        if (!guild?.level) return { embeds: [failEmbed.setDescription("The level system is disabled in this server")] };

        if (subCommand === "top") {
            const top = await msg.client.db.level.findMany({ where: { guild_id: msg.guildId }, orderBy: { experience: "desc" }, take: 10 });
            embed.setTitle(`${msg.guild?.name} leaderboard`);
            embed.setDescription(top.map((x, y) => `${y + 1}. <@${x.user_id}> \`${x.experience}\``).join("\n"));
            return { embeds: [embed] };
        }

        let level = await msg.client.db.level.findUnique({ where: { user_id_guild_id: { guild_id: msg.guildId, user_id: user.id } } });
        if (!level) level = await msg.client.db.level.create({ data: { user_id: msg.user.id, guild_id: msg.guildId } });
        const stats = levelService.calculateLevel(level.experience);

        const NextReward = await msg.client.db.level_reward.findFirst({ where: { guild_id: msg.guildId, level: { gt: stats.level } }, orderBy: { level: "asc" } });

        let progress = "8";
        const scaleSize = 40;
        const playPosition = Math.ceil((stats.currentXP / stats.levelXP) * scaleSize) - 1;

        for (let index = 0; index < scaleSize; index++) {
            if (index < playPosition || playPosition === scaleSize - 1) progress += "=";
            else if (index === playPosition) progress += "D";
            else if (index > playPosition) progress += "-";
        }

        progress += "]";
        const remaining = stats.levelXP - stats.currentXP;

        embed.setTitle(`${msg.user.username}'s level`);
        embed.setThumbnail((msg.member as GuildMember).avatarURL() || msg.user.avatarURL() || msg.user.defaultAvatarURL);
        embed.setDescription(`${msg.user} is currently level ${stats.level}\`\`\`${progress}\`\`\``);
        embed.addField("Level XP", `**Current:** ${stats.currentXP}\n**Next Level:** ${stats.levelXP}`, true);
        embed.addField("Remaining XP", `**XP left:** ${remaining}\n**Messages left:** ${Math.round(remaining / 20)}`, true);
        embed.addField("Total XP", `${stats.totalXP}`, true);
        if (NextReward) embed.addField("Next reward", `**Level:** ${NextReward.level}\n**Role:** <@&${NextReward.role_id}>`);
        return { embeds: [embed] };

    }
};