import { state } from "@app";
import { embedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";

const ACCEPTED_CHANNEL_NAMES = ["confessions", "venting"];

export default Command(

  // Info
  {
    name: "confess",
    description: "Confess something anonymously",
    group: CommandGroup.general,

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "confession",
        description: "What do you want to confess?",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 2,
    },
  },

  // Execute
  async (msg) => {
    const confession = msg.options.getString("confession", true);

    const config = state.guilds.get(msg.guild.id);
    if (!config) throw "Couldn't find guild config";
    if (!msg.channel) throw "Couldn't find channel";

    const isInConfiguredChannel = config.confessionChannelId && msg.channel.id === config.confessionChannelId;
    const isInNamedChannel = ACCEPTED_CHANNEL_NAMES.includes(msg.channel.name);

    const availableConfessionChannels = msg.guild.channels.cache
      .filter(c => (ACCEPTED_CHANNEL_NAMES.includes(c.name) || (c.id === config.confessionChannelId) && c.isTextBased()));

    if (!msg.channel.isTextBased() || !(isInNamedChannel || isInConfiguredChannel)) {
      if (availableConfessionChannels.size === 0) {
        const channels = ACCEPTED_CHANNEL_NAMES.map(name => `\`${name}\``).join(", ");
        return { embeds: [warningEmbedTemplate(`This server has no confession channels configured. channels with the following names are accepted:\n${channels}`)], ephemeral: true };
      } else {
        const available = availableConfessionChannels.map(channel => `- ${channel}`).join("\n");
        return { embeds: [warningEmbedTemplate(`You can only confess in the following channels:\n ${available}`)], ephemeral: true };
      }
    }

    const sent = await msg.channel.send({
      content: `## **Confession:**\n${confession}`,
      allowedMentions: {
        users: [],
        roles: [],
        parse: [],
      },
    }).catch(() => false);

    if (!sent) throw "couldn't send confession";

    const responseEmbed = embedTemplate()
      .setDescription(`Your confession has been sent to the confession channel!`);

    return { embeds: [responseEmbed], ephemeral: true };
  }
);
