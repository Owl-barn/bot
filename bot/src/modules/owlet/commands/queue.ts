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
import { localState } from "..";
import { baseAccessConfig } from "../lib/accessConfig";
import { progressBar } from "../lib/progressbar";
import { QueueInfo } from "../structs/queue";
import { CurrentTrack, Track } from "../structs/track";
import { Duration } from "luxon";

export default Command(
  // Info
  {
    name: "queue",
    description: "Display current queue",
    group: CommandGroup.music,

    arguments: [
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],

    access: baseAccessConfig,

    throttling: {
      duration: 30,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const botId = msg.options.getString("bot_id");

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

    const response = await musicBot.runCommand("Queue", { guildId: msg.guild.id }, msg.id);
    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    embed = makeEmbed(embed, response.queue, response.current, response.queueInfo);

    return { embeds: [embed] };
  }
);

function makeEmbed(
  embed: EmbedBuilder,
  queue: Track[],
  current: CurrentTrack | null,
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
  if (queueInfo.loop) {
    embed.addFields([
      {
        name: "Loop",
        value: queueInfo.loop == 1 ? "🔂 Track" : "🔁 Queue",
      },
    ]);
  }

  console.log({ length: queueInfo.length });
  embed.setFooter({
    text: `Queue length: ${Duration
      .fromMillis(queueInfo.length)
      .toFormat("h:mm:ss")}`,
  });

  return embed;
}
