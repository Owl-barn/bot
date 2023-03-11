import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@src/app";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";
import moment from "moment";

const db = state.db;

export default Command(

  // Info
  {
    name: "stats",
    description: "shows bot stats",
    group: CommandGroup.moderation,

    guildOnly: false,
    premium: 0,

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

    const commandUsage = await db.command_log.groupBy({
      by: ["command_name"],
      _count: true,
      orderBy: { _count: { command_name: "desc" } },
      take: 5,
      where: global ? {} : { guild_id: msg.guildId as string },
    });

    const musicPlayed = await db.songs_played.aggregate({
      _count: { uuid: true },
      _avg: { play_duration: true, song_duration: true },
      _sum: { play_duration: true, song_duration: true },
      where: global ? {} : { guild_id: msg.guildId as string },
    });

    const birthdays = await db.birthdays.count({
      where: global ? {} : { guild_id: msg.guildId as string },
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
        value: `${(
          process.memoryUsage().heapUsed /
          1024 /
          1024
        ).toFixed(2)}MB`,
        inline: true,
      },
      {
        name: "Uptime",
        value: moment(Date.now() - (client.uptime as number))
          .fromNow()
          .replace(" ago", ""),
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
    embed.setTitle(
      global ? "Global bot stats" : `${msg.guild?.name}'s bot stats`,
    );

    if (commandUsage && commandUsage.length > 0) {
      fields.push({
        name: "Command Usage",
        value: commandUsage
          .map((x) => `**${x.command_name}:** ${x._count}`)
          .join("\n"),
      });
    }

    if (musicPlayed) {
      fields.push({
        name: "Music Usage",
        value: `**Average:** \`${Math.round(
          (musicPlayed._avg.play_duration || 0) / 60,
        )}/${Math.round(
          (musicPlayed._avg.song_duration || 0) / 60,
        )}\` minutes
                **sum:** \`
                ${Math.round((musicPlayed._sum.play_duration || 0) / 60,)}/
                ${Math.round((musicPlayed._sum.song_duration || 0) / 60,)}
                \` minutes
                **amount:** \`${musicPlayed._count.uuid}\` songs played
            `,
      });
    }

    embed.addFields(fields);

    return { embeds: [embed] };
  }
);