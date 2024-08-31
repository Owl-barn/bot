import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";
import { DateTime } from "luxon";

const db = state.db;

export default Command(

  // Info
  {
    name: "stats",
    description: "shows bot stats",
    group: CommandGroup.moderation,

    arguments: [
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "global",
        description: "display global stats",
        required: false,
      },
    ],

    throttling: {
      duration: 10,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const client = msg.client;
    const global = msg.options.getBoolean("global");

    const users = msg.client.guilds.cache.reduce(
      (acc, { memberCount }) => acc + memberCount,
      0,
    );

    const commandUsage = await db.commandLog.groupBy({
      by: ["commandName"],
      _count: true,
      orderBy: { _count: { commandName: "desc" } },
      take: 5,
      where: global ? {} : { guildId: msg.guildId },
    });

    const birthdays = await db.userGuildConfig.count({
      where: global ? {} : { guildId: msg.guildId },
    });

    const fields = [
      { name: "Users", value: users.toString(), inline: true },
      {
        name: "Servers",
        value: client.guilds.cache.size.toString(),
        inline: true,
      },
      {
        name: "Channels",
        value: client.channels.cache.size.toString(),
        inline: true,
      },
      {
        name: "Memory usage",
        value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
        inline: true,
      },
      {
        name: "Uptime",
        value: DateTime.fromMillis(Date.now() - (client.uptime as number)).toRelative()?.replace("ago", "") || "0",
        inline: true,
      },
      {
        name: "Commands",
        value: `${state.commands.size} loaded modules`,
        inline: true,
      },
      {
        name: "Birthdays",
        value: `${birthdays} registered birthdays.`,
      },
    ];

    const embed = embedTemplate();
    embed.setTitle((global ? "Global" : `${msg.guild?.name}'s`) + " bot stats");

    if (commandUsage && commandUsage.length > 0) {
      fields.push({
        name: "Command Usage",
        value: commandUsage
          .map((x) => `**${x.commandName}:** ${x._count}`)
          .join("\n"),
      });
    }

    // Music
    const musicPlayed = await db.mediaLog.aggregate({
      _count: { id: true },
      _avg: { progress: true, duration: true },
      _sum: { progress: true, duration: true },
      where: global ? {} : { guildId: msg.guildId },
    });

    if (musicPlayed) {
      fields.push({
        name: "Music Usage",
        value: `**Average:** \`${Math.round((musicPlayed._avg.progress || 0) / 1000 / 60)}/${Math.round((musicPlayed._avg.duration || 0) / 1000 / 60,)}\` minutes
                **sum:** \`${Math.round((musicPlayed._sum.progress || 0) / 1000 / 60)}/${Math.round((musicPlayed._sum.duration || 0) / 1000 / 60,)}\` minutes
                **amount:** \`${musicPlayed._count.id}\` songs played
            `,
      });
    }

    embed.addFields(fields);

    return { embeds: [embed] };
  }
);
