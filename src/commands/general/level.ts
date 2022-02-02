import { GuildMember } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../lib/embedTemplate";
import levelService from "../../lib/level.service";
import progressBar from "../../lib/progressBar";
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
        if (!msg.guildId) throw "a";
        const guild = await msg.client.db.guilds.findUnique({ where: { guild_id: msg.guildId } });
        const failEmbed = failEmbedTemplate();

        if (!guild?.level) return { embeds: [failEmbed.setDescription("The level system is disabled in this server")] };

        switch (subCommand) {
            case "get": return await levelGet(msg);
            case "top": return await levelTop(msg);
        }

        throw "no level subcommand??";
    }
};

async function levelTop(msg: RavenInteraction) {
    if (!msg.guildId) throw "a";
    const embed = embedTemplate();

    const top = await msg.client.db.level.findMany({ where: { guild_id: msg.guildId }, orderBy: { experience: "desc" }, take: 10 });
    embed.setTitle(`${msg.guild?.name} leaderboard`);
    embed.addField("User", top.map((x, y) => `#${y + 1}:  <@${x.user_id}>`).join("\n"), true);
    embed.addField("Level", `\`\`\`${top.map(x => ` ${levelService.calculateLevel(x.experience).level} `).join("\n")}\`\`\``, true);
    return { embeds: [embed] };
}

async function levelGet(msg: RavenInteraction) {
    const member = msg.options.getMember("user") as GuildMember | null || (msg.member as GuildMember);
    if (!msg.guildId) throw "a";
    const failEmbed = failEmbedTemplate();
    const embed = embedTemplate();

    if (member.user.bot) return { embeds: [failEmbed.setDescription("Bots cant have levels.")] };

    let level = await msg.client.db.level.findUnique({ where: { user_id_guild_id: { guild_id: msg.guildId, user_id: member.id } } });
    if (!level) level = await msg.client.db.level.create({ data: { user_id: member.id, guild_id: msg.guildId } });
    const stats = levelService.calculateLevel(level.experience);

    const NextReward = await msg.client.db.level_reward.findFirst({ where: { guild_id: msg.guildId, level: { gt: stats.level } }, orderBy: { level: "asc" } });

    const theme = {
        start: "[",
        end: "]",
        passed: "=",
        remaining: "-",
        indicator: ">",
    };

    const progress = progressBar(stats.currentXP, stats.levelXP, 40, theme);
    const remaining = stats.levelXP - stats.currentXP;

    embed.setTitle(`${member.user.username}'s level`);
    embed.setThumbnail(member.avatarURL() || member.user.avatarURL() || member.user.defaultAvatarURL);
    embed.setDescription(`${member.user} is currently level ${stats.level}\`\`\`${progress}\`\`\``);
    embed.addField("Level XP", `**Current:** ${stats.currentXP}\n**Next Level:** ${stats.levelXP}`, true);
    embed.addField("Remaining XP", `**XP left:** ${remaining}\n**Messages left:** ${Math.round(remaining / 20)}`, true);
    embed.addField("Total XP", `${stats.totalXP}`, true);
    if (NextReward) embed.addField("Next reward", `**Level:** ${NextReward.level}\n**Role:** <@&${NextReward.role_id}>`);
    return { embeds: [embed] };
}