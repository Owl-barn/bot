import { state } from "@app";
import { embedTemplate } from "@lib/embedTemplate";
import { CommandGroup } from "@structs/command";
import { Command } from "@structs/command/command";
import { ApplicationCommandOptionType } from "discord.js";


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

    let confessionChannel;

    // Confession channel id is set
    if (config.confessionChannelId) {
      confessionChannel = await msg.guild.channels.fetch(config.confessionChannelId);
      if (!confessionChannel || !confessionChannel.isTextBased())
        return { content: `Couldn't find confession channel, please contact the bot creator`, ephemeral: true };

    } else {
      // Confession channel id is not set, search by name
      const channelName = "confessions";
      confessionChannel = msg.guild.channels.cache.find(c => c.name === channelName);
      if (!confessionChannel || !confessionChannel.isTextBased())
        return { content: `Couldn't find a channel with the name \`${channelName}\``, ephemeral: true };
    }


    const sent = await confessionChannel.send({
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
