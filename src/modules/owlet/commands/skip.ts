import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  ApplicationCommandOptionType,
  EmbedAuthorOptions,
  GuildMember,
} from "discord.js";
import { baseAccessConfig } from "../lib/accessConfig";
import { canForce } from "../lib/isdj";
import { getOwlet } from "../lib/getBot";

export default Command(
  // Info
  {
    name: "skip",
    description: "skips a song",
    group: CommandGroup.music,

    arguments: [
      {
        type: ApplicationCommandOptionType.Integer,
        name: "index",
        description: "which song to skip",
        min: 0,
        required: false,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "force",
        description: "force skip?",
        required: false,
      },
      {
        name: "bot_id",
        description: "the id of the music bot",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: "track_id",
        description: "the id of the track to skip",
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
    const force = msg.options.getBoolean("force") ?? false;
    const index = msg.options.getInteger("index") ?? undefined;
    const trackId = msg.options.getString("track_id") ?? undefined;

    const member = msg.member as GuildMember;
    const vc = member.voice.channel;

    if (vc == null && botId == undefined) {
      const response = failEmbedTemplate("Join a voice channel first.");
      return { embeds: [response] };
    }

    await msg.deferReply();

    const { owlet, bot } = await getOwlet(msg.guild, vc, botId);
    const author: EmbedAuthorOptions = {
      name: "Skip",
      iconURL: getAvatar(bot),
    };


    // Send the command to the bot.
    const response = await owlet.runCommand(
      "Skip",
      {
        guildId: msg.guild.id,
        userId: msg.user.id,
        canForce: canForce(member, owlet, force),
        trackId,
        index,
      },
      msg.id
    );

    if (response.error) {
      const failEmbed = failEmbedTemplate(response.error);
      failEmbed.setAuthor(author);
      return { embeds: [failEmbed] };
    }

    const embed = embedTemplate().setAuthor(author);
    embed.setDescription(
      `Removed [${response.track.title}](${response.track.url}) from the queue.`
    );

    return { embeds: [embed] };
  },
);
