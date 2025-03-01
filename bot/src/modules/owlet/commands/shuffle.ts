import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  GuildMember,
  ApplicationCommandOptionType,
  EmbedAuthorOptions,
} from "discord.js";
import { localState } from "..";
import { isDJ } from "../lib/isdj";

export default Command(
  // Info
  {
    name: "shuffle",
    description: "Shuffle the queue",
    group: CommandGroup.music,

    arguments: [
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],

    throttling: {
      duration: 30,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    const botId = msg.options.getString("bot_id");
    const member = msg.member as GuildMember;
    const dj = isDJ(member);
    const vc = member.voice.channel;
    const music = localState.controller;

    const failEmbed = failEmbedTemplate();
    const embed = embedTemplate();

    if (vc == null) {
      const response = failEmbed.setDescription(
        "Join a voice channel first.",
      );
      return { embeds: [response] };
    }

    const musicBot =
      botId && dj
        ? music.getOwletById(botId)
        : music.getOwlet(vc.id, vc.guildId);

    const botState = musicBot?.getGuild(msg.guild.id);

    if (!musicBot || !botState || !botState.channelId)
      return { embeds: [failEmbed.setDescription("No music playing")] };

    const bot = await msg.guild.members.fetch(musicBot.getId());
    const author: EmbedAuthorOptions = {
      name: "Shuffle",
      iconURL: getAvatar(bot),
    };

    failEmbed.setAuthor(author);
    embed.setAuthor(author);

    const memberCount = vc.members.filter((x) => !x.user.bot).size;

    if (!dj && (vc.id !== botState.channelId || memberCount > 1)) {
      const response = failEmbed.setDescription(
        "You need the `DJ` role to do that!",
      );
      return { embeds: [response] };
    }

    // Send the command to the music bot
    const response = await musicBot.runCommand("Shuffle", { guildId: msg.guild.id }, msg.id);
    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    embed.setDescription(`Shuffled all ${response.queueSize} tracks in the queue.`);

    return { embeds: [embed] };
  }
);
