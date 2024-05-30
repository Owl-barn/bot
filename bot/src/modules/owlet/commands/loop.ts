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
import { baseAccessConfig } from "../lib/accessConfig";
import { isDJ } from "../lib/isdj";

export default Command(
  // Info
  {
    name: "loop",
    description: "loop the queue or the current song",
    group: CommandGroup.music,

    arguments: [
      {
        name: "loop_mode",
        description: "the loop mode",
        type: ApplicationCommandOptionType.Number,
        choices: [
          { name: "off", value: 0 },
          { name: "track", value: 1 },
          { name: "queue", value: 2 },
        ],
        required: true,
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
    const loop = msg.options.getNumber("loop_mode", true);
    const botId = msg.options.getString("bot_id");

    const member = msg.member as GuildMember;
    const dj = isDJ(member);
    const vc = member.voice.channel;
    const music = localState.controller;

    const failEmbed = failEmbedTemplate();
    const embed = embedTemplate();

    if (vc == null && botId == undefined) {
      const response = failEmbed.setDescription("Join a voice channel first.");
      return { embeds: [response] };
    }

    const musicBot = botId
      ? music.getOwletById(botId)
      : vc && music.getOwlet(vc.id, vc.guildId);

    if (!musicBot) {
      const response = failEmbed.setDescription("No available music bots.");
      return { embeds: [response] };
    }

    const bot = await msg.guild.members.fetch(musicBot.getId());
    const author: EmbedAuthorOptions = {
      name: "Loop",
      iconURL: getAvatar(bot),
    };

    failEmbed.setAuthor(author);
    embed.setAuthor(author);

    if (
      !dj || !vc ||
      vc?.id !== musicBot.getGuild(msg.guild.id)?.channelId
    ) {
      return {
        embeds: [failEmbed.setDescription("You need the `DJ` role to do that!")],
      };
    }


    const response = await musicBot.runCommand(
      "Loop",
      { guildId: msg.guild.id, loop },
      msg.id
    );

    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    let loopMode = "";

    switch (response.loop) {
      case 0:
        loopMode = "❎ Off";
        break;
      case 1:
        loopMode = "🔂 Track";
        break;
      case 2:
        loopMode = "🔁 Queue";
        break;
    }

    embed.setDescription(`now set to: ${loopMode}`);

    return { embeds: [embed] };
  }
);
