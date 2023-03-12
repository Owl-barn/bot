import { state } from "@app";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { formatNumber } from "@lib/number";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { calculateLevelFromXP } from "../../lib/calculateLevelFromXP";
import { progressBar } from "modules/owlet/lib/progressbar";

const db = state.db;

export default SubCommand(

  // Info
  {
    name: "get",
    description: "Get your own or your friends current level!",

    arguments: [
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
  },

  // Execute
  async (msg) => {
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

    const config = state.guilds.get(msg.guildId);
    if (!config || !config.level) {
      const response = failEmbed.setDescription(
        "Leveling is not enabled on this server.",
      );
      return { embeds: [response] };
    }

    let level = await db.level.findUnique({
      where: {
        userId_guildId: {
          guildId: msg.guildId,
          userId: member.id,
        },
      },
    });

    if (!level) {
      level = await db.level.create({
        data: {
          userId: member.id,
          guildId: msg.guildId,
        },
      });
    }

    const rank = await db.level.aggregate({
      _count: { userId: true },
      where: {
        experience: { gt: level.experience },
        guildId: msg.guildId,
      },
    });

    rank._count.userId += 1;
    const stats = calculateLevelFromXP(level.experience);

    const NextReward = await db.levelReward.findFirst({
      where: {
        guildId: msg.guildId,
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
    const remainingMsg = Math.round(remaining / 20) || 1;

    embed.setTitle(`${member.user.username}'s level`);
    embed.setThumbnail(getAvatar(member) || null);

    embed.setDescription(
      `**Level:** ${stats.level}\n` +
      `**Rank:** #${rank._count.userId}\n` +
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
          `**Msg:** ~${formatNumber(remainingMsg)}`,
        inline: true,
      },
    ]);

    if (NextReward) {
      embed.addFields([
        {
          name: "Next reward",
          value:
            `**Level:** ${NextReward.level}\n` +
            `**Role:** <@&${NextReward.roleId}>`,
          inline: true,
        },
      ]);
    }

    return { embeds: [embed] };
  }

);
