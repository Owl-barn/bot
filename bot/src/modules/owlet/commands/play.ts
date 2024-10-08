import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, GuildMember, EmbedAuthorOptions, escapeMarkdown, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { failEmbedTemplate, embedTemplate } from "lib/embedTemplate";
import { localState as VCState } from "modules/private-room";
import { isDJ } from "../lib/isdj";
import { QueueInfo } from "../structs/queue";
import { Track } from "../structs/track";
import { baseAccessConfig } from "../lib/accessConfig";
import { ReturnMessage } from "@structs/returnmessage";
import { getOwlet } from "../lib/getBot";
import skipButton from "../components/buttons/remove";
import bumpButton from "../components/buttons/bump";
import { Duration } from "luxon";

export default Command(

  // Info
  {
    name: "play",
    description: "Play or queue a song",
    group: CommandGroup.music,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "song",
        description: "song name or youtube/spotify url",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "force",
        description: "Play the song immediately (requires perms)",
        required: false,
      },
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],

    access: baseAccessConfig,
  },

  // Execute
  async (msg) => {
    const query = msg.options.getString("song", true);
    const botId = msg.options.getString("bot_id");
    const hidden = msg.options.getBoolean("hidden") ?? false;
    let force = msg.options.getBoolean("force") ?? false;

    const member = msg.member as GuildMember;
    const vc = member.voice.channel;

    if (vc == null) {
      return {
        embeds: [failEmbedTemplate("Join a voice channel first.")],
      };
    }

    // Check if the user is in a waiting room
    if (VCState.controller.getRooms().find((x) => x.waitingRoomId == vc.id)) {
      return {
        embeds: [failEmbedTemplate("You can't play music in a waiting room.")],
      };
    }

    await msg.deferReply({ ephemeral: hidden });

    // Set force to false if the user is not a DJ.
    if (!isDJ(member) && force) force = false;

    // Get owlet.
    const node = await getOwlet(msg.guild, vc, botId).catch(() => null);
    if (!node) {
      return {
        embeds: [failEmbedTemplate("There are currently no music bots available.")],
      };
    }

    const { owlet, bot } = node;
    const author: EmbedAuthorOptions = {
      name: "Play",
      iconURL: getAvatar(bot),
    };

    const failEmbed = failEmbedTemplate();
    failEmbed.setAuthor(author);

    if (owlet.isDisabled()) {
      failEmbed.setDescription("Maintenance in progress please try a different owlet or try again later (~10 minutes)");
      return { embeds: [failEmbed] };
    }

    const requestData = {
      guildId: msg.guild.id,
      channelId: vc.id,
      userId: msg.user.id,
      query,
      force,
    };

    const response = await owlet.runCommand("Play", requestData, msg.id);
    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    const res = generateResponse(response.track, response.queueInfo, author);

    return res;
  },
);

function generateResponse(track: Track, queueInfo: QueueInfo, author: EmbedAuthorOptions): ReturnMessage {
  const embed = embedTemplate();
  let channelName = escapeMarkdown(track.author);
  channelName = channelName.replace(/[()[\]]/g, "");
  const playing = queueInfo.size === 0;

  embed
    .setThumbnail(track.thumbnail)
    .setTitle(queueInfo.size < 1 ? `Now playing` : "Song queued")
    .setDescription(`**[${track.title}](${track.url})**`)
    // .setFooter({ text: track.id }) // for some reason this fucks up the formatting!??
    .setAuthor(author)
    .addFields([
      { name: "Channel", value: `*${channelName}*`, inline: true },
      { name: "Duration", value: `${track.duration}`, inline: true },
      {
        name: "Queue Position",
        value: `*${playing ? "Currently playing" : queueInfo.size}*`,
        inline: true,
      },
    ]);


  if (!playing) {
    const timeTillPlay = Duration
      .fromMillis(queueInfo.length - track.durationMs)
      .toFormat("h:mm:ss");

    embed.addFields([
      {
        name: "Time untill play",
        value: `*${timeTillPlay}*`,
        inline: true,
      },
    ]);
  }

  // Buttons
  const components = [generateButtons(track.id, !playing)];

  return { embeds: [embed], components };
}

export function generateButtons(id: string, showBump = false) {
  const buttons = [];

  if (showBump)
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${bumpButton.info.name}-${id}`)
        .setLabel("Play now")
        .setStyle(ButtonStyle.Secondary)
    );

  buttons.push(
    new ButtonBuilder()
      .setCustomId(`${skipButton.info.name}-${id}`)
      .setLabel("Skip")
      .setStyle(ButtonStyle.Danger)
  );


  return (new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>)
    .setComponents(buttons);
}
