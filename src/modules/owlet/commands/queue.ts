import { EmbedAuthorOptions, italic } from "@discordjs/builders";
import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  GuildMember,
  EmbedBuilder,
  ApplicationCommandOptionType,
  escapeMarkdown,
  APIEmbedField,
} from "discord.js";
import moment from "moment";
import { localState } from "..";
import { progressBar } from "../lib/progressbar";
import { QueueInfo } from "../structs/queue";
import { CurrentTrack, Track } from "../structs/track";
import { wsResponse } from "../structs/websocket";

export default Command(
  // Info
  {
    name: "queue",
    description: "shows queue",
    group: CommandGroup.music,

    arguments: [
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],

    premium: 1,

    throttling: {
      duration: 30,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const botId = msg.options.get("bot_id") as string | null;
    if (!msg.guild) throw "no guild in stop command??";

    const member = msg.member as GuildMember;
    const vc = member.voice.channel;
    const music = localState.controller;

    const failEmbed = failEmbedTemplate();
    let embed = embedTemplate();

    if (vc == null && botId == undefined) {
      const response = failEmbed.setDescription(
        "Join a voice channel first.",
      );
      return { embeds: [response] };
    }

    const musicBot = botId
      ? music.getOwletById(botId)
      : vc && music.getOwlet(vc.id, vc.guildId);

    if (!musicBot) {
      const response = failEmbed.setDescription(
        "No available music bots.",
      );
      return { embeds: [response] };
    }

    const bot = await msg.guild.members.fetch(musicBot.getId());
    const author: EmbedAuthorOptions = {
      name: "Queue",
      iconURL: getAvatar(bot),
    };

    failEmbed.setAuthor(author);
    embed.setAuthor(author);

    const request = {
      command: "Queue",
      mid: msg.id,
      data: {
        guildId: msg.guild.id,
      },
    };

    const data = (await musicBot.send(request)) as response;

    if (data.error) {
      const response = failEmbed.setDescription(data.error);
      return { embeds: [response] };
    }

    embed = makeEmbed(embed, data.queue, data.current, data.queueInfo);

    return { embeds: [embed] };
  }
);

function makeEmbed(
  embed: EmbedBuilder,
  queue: Track[],
  current: CurrentTrack,
  queueInfo: QueueInfo,
) {
  if (!current) {
    embed.addFields([
      { name: "Now playing:", value: "Nothing is playing right now" },
    ]);
    return embed;
  }

  const progress = progressBar(current.progressMs / current.durationMs, 20);

  const fieldContent = `
    [${escapeMarkdown(current.title.substring(0, 40))}](${current.url})
    **${current.progress}** ${progress} **${current.duration}**
    ${italic(`Requested by: <@!${current.requestedBy}>`)}
    `;

  const list: APIEmbedField[] = [];

  list.push({ name: "Now playing:", value: fieldContent });
  let x = 0;

  if (queue.length >= 24) {
    queue = queue.slice(0, 23);
  }

  for (const song of queue) {
    x++;
    list.push({
      name: x.toString(),
      value: `[${song.title}](${song.url}) - ${song.duration}\n${italic(
        `Requested by: <@!${song.requestedBy}>`,
      )}`,
    });
  }

  embed.addFields(list);
  if (queueInfo.repeat) {
    embed.addFields([
      {
        name: "Loop",
        value: queueInfo.repeat == 1 ? "🔂 Track" : "🔁 Queue",
      },
    ]);
  }

  embed.setFooter({
    text: `Queue length: ${moment()
      .startOf("day")
      .milliseconds(queueInfo.length)
      .format("H:mm:ss")}`,
  });

  return embed;
}

interface response extends wsResponse {
  queue: Track[];
  current: CurrentTrack;
  queueInfo: QueueInfo;
}
