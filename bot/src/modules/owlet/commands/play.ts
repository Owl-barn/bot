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
import { Playlist } from "../structs/playlist";

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
        name: "play_next",
        description: "Play the song next",
        required: false,
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
    let next = msg.options.getBoolean("play_next") ?? false;

    const member = msg.member as GuildMember;
    const vc = member.voice.channel;
    const hasDJPerms = isDJ(member);

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
    if (!hasDJPerms && force) force = false;
    if (!hasDJPerms && next) next = false;

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

    const memberCount = vc.members.filter((x) => !x.user.bot).size;
    const allowPlaylists = hasDJPerms || memberCount === 1;

    const requestData = {
      guildId: msg.guild.id,
      userId: msg.user.id,
      channelId: vc.id,
      allowPlaylists,
      next,
      query,
      force,
    };

    const response = await owlet.runCommand("Play", requestData, msg.id);
    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    const res = generateResponse(response.track, response.playlist, response.queueInfo, author);

    return res;
  },
);

function generateResponse(track: Track, playlist: Playlist | undefined, queueInfo: QueueInfo, author: EmbedAuthorOptions): ReturnMessage {
  const embed = embedTemplate();
  let channelName = escapeMarkdown(track.author);
  channelName = channelName.replace(/[()[\]]/g, "");
  const playing = queueInfo.size === 0;

  const queuePosition = track.position !== undefined
    ? track.position + 1
    : playing
      ? "Currently playing"
      : queueInfo.size;

  embed.setAuthor(author);

  if (playlist) {
    embed
      .setThumbnail(playlist.thumbnail)
      .setTitle("Playlist queued")
      .setDescription(`**[${playlist.title}](${playlist.url})**`)
      .addFields([
        { name: "Channel", value: `*${playlist.author}*`, inline: true },
        { name: "Duration", value: `${playlist.duration}`, inline: true },
        { name: "Songs", value: `*${playlist.size}*`, inline: true },
        { name: "Queue Position", value: `*${queuePosition}*`, inline: true },
      ]);
  } else {
    embed
      .setThumbnail(track.thumbnail)
      .setTitle(queueInfo.size < 1 ? `Now playing` : "Song queued")
      .setDescription(`**[${track.title}](${track.url})**`)
      // .setFooter({ text: track.id })
      .addFields([
        { name: "Channel", value: `*${channelName}*`, inline: true },
        { name: "Duration", value: `${track.duration}`, inline: true },
        { name: "Queue Position", value: `*${queuePosition}*`, inline: true },
      ]);
  }


  if (!playing) {
    const timeUntilPlay = Duration
      .fromMillis(queueInfo.length - track.durationMs)
      .toFormat("h:mm:ss");

    embed.addFields([
      {
        name: "Time until play",
        value: `*${timeUntilPlay}*`,
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
