import { SubCommand } from "@structs/command/subcommand";
import { embedTemplate } from "src/lib/embedTemplate";
import { localState } from "../..";
import { QueueInfo } from "../../structs/queue";
import { Track, CurrentTrack } from "../../structs/track";
import { wsResponse } from "../../structs/websocket";

SubCommand(

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
    if (!msg.guild) throw "no guild in owlet status command??";
    const embed = embedTemplate();
    const client = msg.client;

    embed.setTitle("Music Bot List");
    const bots = localState.controller.getOwlets();

    for (const bot of bots.values()) {
      const botList = [];
      const botUser = await msg.client.users.fetch(bot.getId());

      for (const guild of bot.getGuilds().values()) {
        if (!guild.channelId) continue;
        const request = {
          command: "Queue",
          mid: bot.getId() + guild.id,
          data: { guildId: msg.guild.id },
        };

        const queue = (await bot
          .send(request)
          .catch(console.error)) as Response;

        if (!queue || queue.error) continue;

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
          name: botUser.username,
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

interface Response extends wsResponse {
  queue: Track[];
  current: CurrentTrack;
  queueInfo: QueueInfo;
}
