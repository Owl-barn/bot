import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  EmbedAuthorOptions,
  GuildMember,
} from "discord.js";
import { localState } from "..";
import { baseAccessConfig } from "../lib/accessConfig";
import { isDJ } from "../lib/isdj";
import { Owlet } from "../lib/owlet";
import { Track } from "../structs/track";

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
    const index = msg.options.getInteger("index") ?? 0;

    const member = msg.member as GuildMember;
    const vc = member.voice.channel;
    const dj = isDJ(member);
    const music = localState.controller;

    const failEmbed = failEmbedTemplate();
    const embed = embedTemplate();

    if (vc == null && botId == undefined) {
      const response = failEmbed.setDescription(
        "Join a voice channel first.",
      );
      return { embeds: [response] };
    }

    await msg.deferReply();

    // Get bot.
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
      name: "Skip",
      iconURL: getAvatar(bot),
    };

    embed.setAuthor(author);
    failEmbed.setAuthor(author);

    const djBool = dj && force;
    let aloneBool = false;

    // Calculate if the user is alone in the voice channel
    if (vc) {
      const memberCount = vc.members.filter((x) => !x.user.bot).size;
      aloneBool = vc.id == musicBot.getGuild(msg.guild.id)?.channelId;
      aloneBool = aloneBool && memberCount == 1;
    }

    // If the bot is alone with the user or if a dj is forcing the skip.
    if (djBool || aloneBool) {
      const response = await skip(msg, musicBot, index);

      if (response.error) {
        failEmbed.setDescription(response.error);
        return { embeds: [failEmbed] };
      }

      embed.setDescription(`Skipped song`);
      return { embeds: [embed] };
    }

    // Get queue data from the bot.
    const queueResponse = await musicBot.runCommand("Queue", { guildId: msg.guild.id }, msg.id + "_queue");
    if (queueResponse.error)
      return { embeds: [failEmbed.setDescription(queueResponse.error)] };


    const queue = queueResponse.queue;
    const current = queueResponse.current;

    // Index is specified.
    if (index !== 0) {
      // User provided an index that is out of bounds.
      if (queue.length == 0 || index > queue.length) {
        const fail = failEmbed.setDescription(
          "I couldn't find a song at that position, Try a lower number?",
        );
        return { embeds: [fail] };
      }

      // User provided a valid index but doesnt own the song.
      const selected = queue[index - 1];

      if (selected && selected.requestedBy === msg.user.id) {
        // User provided a valid index and owns the song.
        const response = await skip(msg, musicBot, index);
        if (response.error) {
          failEmbed.setDescription(response.error);
          return { embeds: [failEmbed] };
        }
        return {
          embeds: [
            embed.setDescription(
              `Successfully skipped \`${(response.track as Track).title
              }\``,
            ),
          ],
        };
      }

      // User tried skipping current song and they added the song.
    } else if (current?.requestedBy == msg.user.id) {
      const response = await skip(msg, musicBot, index);
      if (response.error) {
        failEmbed.setDescription(response.error);
        return { embeds: [failEmbed] };
      }
      return {
        embeds: [
          embed.setDescription(
            `Successfully skipped \`${(response.track as Track).title
            }\``,
          ),
        ],
      };
    }

    failEmbed.setDescription(
      `You can't skip that song because you didn't request it.`,
    );

    return { embeds: [failEmbed] };
  },
);

async function skip(
  msg: ChatInputCommandInteraction<"cached">,
  musicBot: Owlet,
  index: number,
) {
  return await musicBot.runCommand(
    "Skip",
    { guildId: msg.guild.id, index },
    msg.id
  );
}
