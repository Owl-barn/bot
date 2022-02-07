import { GuildMember, MessageActionRow, MessageButton } from "discord.js";
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
            case "top": return levelTop(msg);
        }

        throw "no level subcommand??";
    }
};

function levelTop(msg: RavenInteraction): returnMessage {
    if (!msg.guildId) throw "a";
    const embed = embedTemplate();

    embed.setTitle(`${msg.guild?.name} leaderboard`);
    embed.setDescription("Click the link below to view the server's leaderboard");

    const component = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("Leaderboard")
                .setStyle("LINK")
                .setURL(`${process.env.URL}/leaderboard/${msg.guildId}`),
        );


    return { embeds: [embed], components: [component] };
}

async function levelGet(msg: RavenInteraction): Promise<returnMessage> {
    const member = msg.options.getMember("user") as GuildMember | null || (msg.member as GuildMember);
    if (!msg.guildId) throw "a";
    const failEmbed = failEmbedTemplate();
    const embed = embedTemplate();

    if (member.user.bot) return { embeds: [failEmbed.setDescription("Bots cant have levels.")] };

    let level = await msg.client.db.level.findUnique({ where: { user_id_guild_id: { guild_id: msg.guildId, user_id: member.id } } });
    if (!level) level = await msg.client.db.level.create({ data: { user_id: member.id, guild_id: msg.guildId } });
    const rank = await msg.client.db.level.aggregate({ _count: { user_id: true }, where: { experience: { gt: level.experience }, guild_id: msg.guildId } });
    rank._count.user_id += 1;
    const stats = levelService.calculateLevel(level.experience);

    const NextReward = await msg.client.db.level_reward.findFirst({ where: { guild_id: msg.guildId, level: { gt: stats.level } }, orderBy: { level: "asc" } });

    const theme = {
        start: "[",
        end: "]",
        passed: "=",
        remaining: "-",
        indicator: ">",
    };

    const progress = progressBar(stats.currentXP, stats.levelXP, 30, theme);
    const remaining = stats.levelXP - stats.currentXP;

    embed.setTitle(`${member.user.username}'s level`);
    embed.setThumbnail(member.avatarURL() || member.user.avatarURL() || member.user.defaultAvatarURL);
    embed.setDescription(`**Level:** ${stats.level}\n**Rank:** #${rank._count.user_id}\n**Total XP:** ${formatNumber(stats.totalXP)}\n\`\`\`${stats.level}${progress}${stats.level + 1}\`\`\``);
    embed.addField("Next level", `**XP gained:** ${formatNumber(stats.currentXP)}\n**XP needed:** ${formatNumber(stats.levelXP)}`, true);
    embed.addField("Needed to level up", `**XP:** ${formatNumber(remaining)}\n**Msg:** ~${formatNumber(Math.round(remaining / 20))}`, true);
    if (NextReward) embed.addField("Next reward", `**Level:** ${NextReward.level}\n**Role:** <@&${NextReward.role_id}>`, true);
    return { embeds: [embed] };
}

function formatNumber(number: number, decPlaces = 1) {
    // 2 decimal places => 100, 3 => 1000, etc
    decPlaces = Math.pow(10, decPlaces);

    // Enumerate number abbreviations
    const abbrev = ["k", "M", "B", "T"];

    // Go through the array backwards, so we do the largest first
    for (let i = abbrev.length - 1; i >= 0; i--) {

        // Convert array index to "1000", "1000000", etc
        const size = Math.pow(10, (i + 1) * 3);

        // If the number is bigger or equal do the abbreviation
        if (size <= number) {
            // Here, we multiply by decPlaces, round, and then divide by decPlaces.
            // This gives us nice rounding to a particular decimal place.
            number = Math.round(number * decPlaces / size) / decPlaces;

            // Handle special case where we round up to the next abbreviation
            if ((number == 1000) && (i < abbrev.length - 1)) {
                number = 1;
                i++;
            }

            // Add the letter for the abbreviation
            return `${number}${abbrev[i]}`;
        }
    }

    return number;
}