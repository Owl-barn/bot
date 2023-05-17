import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType, GuildMember, EmbedAuthorOptions, escapeMarkdown, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import moment from "moment";
import { failEmbedTemplate, embedTemplate } from "lib/embedTemplate";
import { localState as VCState } from "modules/private-room";
import { isDJ } from "../lib/isdj";
import { QueueInfo } from "../structs/queue";
import { Track } from "../structs/track";
import { baseAccessConfig } from "../lib/accessConfig";
import { ReturnMessage } from "@structs/returnmessage";
import { getOwlet } from "../lib/getBot";

export default Command(

  // Info
  {
    name: "play",
    description: "Plays a song",
    group: CommandGroup.music,

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
    const { owlet, bot } = await getOwlet(msg.guild, vc, botId);
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

  embed
    .setThumbnail(track.thumbnail)
    .setTitle(queueInfo.size < 1 ? `Now playing` : "Song queued")
    .setDescription(`**[${track.title}](${track.url})**`)
    .setFooter({ text: track.id })
    .setAuthor(author)
    .addFields([
      { name: "Channel", value: `*${channelName}*`, inline: true },
      { name: "Duration", value: `${track.duration}`, inline: true },
      {
        name: "Queue Position",
        value: `*${queueInfo.size !== 0 ? queueInfo.size : "Currently playing"}*`,
        inline: true,
      },
    ]);

  const components = [];

  if (queueInfo.size !== 0) {
    const timeTillPlay = moment()
      .startOf("day")
      .milliseconds(queueInfo.length - track.durationMs)
      .format("H:mm:ss");

    // Buttons
    components.push(generateButtons(track.id));

    embed.addFields([
      {
        name: "Time untill play",
        value: `*${timeTillPlay}*`,
        inline: true,
      },
    ]);
  }

  return { embeds: [embed], components };
}

function generateButtons(id: string) {
  const buttons = [];

  // buttons.push(
  //   new ButtonBuilder()
  //     .setCustomId(`track-now_${id}`)
  //     .setLabel("Play Now")
  //     .setStyle(ButtonStyle.Primary)
  // );

  buttons.push(
    new ButtonBuilder()
      .setCustomId(`track-rm_${id}`)
      .setLabel("Remove")
      .setStyle(ButtonStyle.Danger)
  );


  return (new ActionRowBuilder() as ActionRowBuilder<ButtonBuilder>)
    .setComponents(buttons);
}
