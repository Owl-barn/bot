import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";
import { DateTime } from "luxon";
import { formatNumber } from "@lib/number";

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

    const users = global ? msg.client.guilds.cache.reduce(
      (acc, { memberCount }) => acc + memberCount,
      0,
    ) : msg.guild?.memberCount || "??";

    const commandUsage = await db.commandLog.groupBy({
      by: ["commandName"],
      _count: true,
      orderBy: { _count: { commandName: "desc" } },
      take: 5,
      where: global ? {} : { guildId: msg.guildId },
    });

    const fields = [
      { name: "Users", value: users.toString(), inline: true },
      {
        name: "Channels",
        value: global ? client.channels.cache.size.toString() : msg.guild?.channels.cache.size.toString() || "??",
        inline: true,
      },
      {
        name: "Memory usage",
        value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
        inline: true,
      },
      {
        name: "Uptime",
        value: DateTime.fromMillis(Date.now() - (client.uptime as number)).toRelative()?.replace("ago", "") || "?/",
        inline: true,
      },
      {
        name: "Commands",
        value: `${state.commands.size} loaded modules`,
        inline: true,
      },
    ];

    if (global) {
      fields.splice(1, 0, {
        name: "Servers",
        value: client.guilds.cache.size.toString(),
        inline: true,
      });
    }

    for (const module of state.modules.values()) {
      if (module.stats) {
        const moduleStats = await module.stats(global ? undefined : msg.guildId);
        fields.push(moduleStats);
      }
    }

    const embed = embedTemplate();
    embed.setTitle((global ? "Global" : `${msg.guild?.name}'s`) + " bot stats");

    if (commandUsage && commandUsage.length > 0) {
      fields.push({
        name: "Command Usage",
        value: commandUsage
          .map((x) => `**${x.commandName}:** ${formatNumber(x._count)}`)
          .join("\n"),
        inline: false,
      });
    }

    embed.addFields(fields);

    return { embeds: [embed] };
  }
);
