import { SubCommand } from "@structs/command/subcommand";
import { embedTemplate } from "lib/embedTemplate";
import { localState } from "../..";
import { escapeMarkdown } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "status",
    description: "get the status of all the owlets",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const embed = embedTemplate();
    const client = msg.client;

    embed.setTitle("Music Bot List");
    const bots = localState.controller.getOwlets();

    for (const bot of bots.values()) {
      const botList = [];
      const botUser = await msg.client.users.fetch(bot.getId());

      for (const guild of bot.getGuilds().values()) {
        if (!guild.channelId) continue;

        const queue = await bot.runCommand(
          "Queue",
          { guildId: msg.guild.id },
          bot.getId() + guild.id,
        );

        if (queue.error || queue.exception) continue;

        const queueLength = new Date(queue.queueInfo.length)
          .toISOString()
          .slice(11, 19);

        const discordGuild = await client.guilds.fetch(guild.id);
        const output = [
          queue.queueInfo.paused ? "❌" : "✅",
          queueLength,
          queue.queue.length,
          discordGuild.name,
        ];

        botList.push(output.join(" - "));
      }
      embed.addFields([
        {
          name: escapeMarkdown(botUser.username),
          value:
            botList.length == 0
              ? "Nothing playing"
              : botList.join("\n"),
        },
      ]);
    }

    if (embed.data.fields?.length == 0) {
      return { content: "No owlets found" };
    }

    return { embeds: [embed] };
  },

);
