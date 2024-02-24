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
    name: "pause",
    description: "pause the bot",
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
      name: "Pause",
      iconURL: getAvatar(bot),
    };

    failEmbed.setAuthor(author);
    embed.setAuthor(author);

    if (vc) {
      const memberCount = vc.members.filter((x) => !x.user.bot).size;

      if (
        !dj &&
        (vc.id !== musicBot.getGuild(msg.guild.id)?.channelId ||
          memberCount > 1)
      ) {
        const response = failEmbed.setDescription(
          "You do not have the `DJ` role.",
        );
        return { embeds: [response] };
      }
    }

    const response = await musicBot.runCommand("Pause", { guildId: msg.guild.id }, msg.id);

    if (response.error) return { embeds: [failEmbed.setDescription(response.error)] };

    embed.setDescription(`Music ${response.paused ? "paused" : "resumed"}`);

    return { embeds: [embed] };
  },
);
