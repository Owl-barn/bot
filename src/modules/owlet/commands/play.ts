import { getAvatar } from "@src/lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, GuildMember, EmbedAuthorOptions, EmbedBuilder, escapeMarkdown } from "discord.js";
import moment from "moment";
import { failEmbedTemplate, embedTemplate } from "src/lib/embedTemplate";
import GuildConfig from "src/lib/guildconfig.service";
import { localState } from "..";
import { isDJ } from "../lib/isdj";
import { QueueInfo } from "../structs/queue";
import { Track } from "../structs/track";
import { wsResponse } from "../structs/websocket";

export default Command(
  // Info
  {
    name: "play",
    description: "Plays a song",
    group: CommandGroup.music,

    guildOnly: true,
    premium: 1,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "song",
        description: "song name or url",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "force",
        description: "force play?",
        required: false,
      },
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],

    throttling: {
      duration: 30,
      usages: 6,
    },
  },

  // Execute
  async (msg) => {
    const query = msg.options.getString("song", true);
    const botId = msg.options.getString("bot_id");
    const hidden = msg.options.getBoolean("hidden") ?? false;
    let force = msg.options.getBoolean("force") ?? false;
    if (!msg.guild) throw "no guild in stop command??";

    const member = msg.member as GuildMember;
    const dj = isDJ(member);
    const vc = member.voice.channel;
    const music = localState.controller;

    if (vc == null) {
      return {
        embeds: [failEmbedTemplate("Join a voice channel first.")],
      };
    }

    const guildconfig = GuildConfig.getGuild(msg.guild.id);
    if (guildconfig?.privateRooms.find((x) => x.wait_channel_id == vc.id)) {
      return {
        embeds: [
          failEmbedTemplate(
            "You can't play music in a waiting room.",
          ),
        ],
      };
    }

    if (!dj && force) force = false;

    await msg.deferReply({ ephemeral: hidden });

    const musicBot =
      botId && dj
        ? music.getOwletById(botId)
        : music.getOwlet(vc.id, vc.guildId);

    if (!musicBot)
      return { embeds: [failEmbedTemplate("No available music bots.")] };

    const bot = await msg.guild.members.fetch(musicBot.getId());
    const author: EmbedAuthorOptions = {
      name: "Play",
      iconURL: getAvatar(bot),
    };

    const failEmbed = failEmbedTemplate();
    let embed = embedTemplate();

    failEmbed.setAuthor(author);

    if (musicBot.isDisabled()) {
      failEmbed.setDescription(
        "Maintenance in progress please try a different owlet or try again later (~10 minutes)",
      );
      return {
        embeds: [failEmbed],
      };
    }

    const request = {
      command: "Play",
      mid: msg.id,
      data: {
        guildId: msg.guild.id,
        channelId: vc.id,
        userId: msg.user.id,
        query,
        force,
      },
    };

    const response = (await musicBot.send(request)) as response;

    if (response.error)
      return { embeds: [failEmbed.setDescription(response.error)] };

    embed = makeEmbed(embed, response.track, response.queueInfo);
    embed.setAuthor(author);

    return {
      embeds: [embed],
    };
  },
);

function makeEmbed(embed: EmbedBuilder, track: Track, queueInfo: QueueInfo) {
  let channelName = escapeMarkdown(track.author);
  channelName = channelName.replace(/[()[\]]/g, "");

  embed
    .setThumbnail(track.thumbnail)
    .setTitle(queueInfo.size < 1 ? `Now playing` : "Song queued")
    .setDescription(`**[${track.title}](${track.url})**`)
    .addFields([
      { name: "Channel", value: `*${channelName}*`, inline: true },
      { name: "Duration", value: `${track.duration}`, inline: true },
      {
        name: "Queue Position",
        value: `*${queueInfo.size !== 0 ? queueInfo.size : "Currently playing"}*`,
        inline: true,
      },
    ]);

  if (queueInfo.size !== 0) {
    const timeTillPlay = moment()
      .startOf("day")
      .milliseconds(queueInfo.length - track.durationMs)
      .format("H:mm:ss");

    embed.addFields([
      {
        name: "Time untill play",
        value: `*${timeTillPlay}*`,
        inline: true,
      },
    ]);
  }

  return embed;
}

interface response extends wsResponse {
  track: Track;
  queueInfo: QueueInfo;
}
