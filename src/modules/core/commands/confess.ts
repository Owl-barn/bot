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

    const confessionEmbed = embedTemplate()
      .setTitle(`Confession`)
      .setDescription(confession);

    const channelName = "confessions";

    const confessionChannel = msg.guild.channels.cache.find(c => c.name === channelName);
    if (!confessionChannel || !confessionChannel.isTextBased())
      return { content: `Couldn't find a channel with the name \`${channelName}\``, ephemeral: true };

    const sent = await confessionChannel.send({ embeds: [confessionEmbed] })
      .catch(() => false);

    if (!sent) throw "couldn't send confession";

    const responseEmbed = embedTemplate()
      .setDescription(`Your confession has been sent to the confession channel!`);

    return { embeds: [responseEmbed], ephemeral: true };
  }
);
