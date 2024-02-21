import path from "path";

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

    const channelName = "confessions";
    const confessionChannel = msg.guild.channels.cache.find(c => c.name === channelName);
    if (!confessionChannel || !confessionChannel.isTextBased())
      return { content: `Couldn't find a channel with the name \`${channelName}\``, ephemeral: true };

    const confessionEmbed = embedTemplate()
      .setTitle(`Confession`)
      .setDescription(confession);

    if (isImageUrl(confession)) {
      confessionEmbed.setImage(confession);
    }

    const sent = await confessionChannel.send({ embeds: [confessionEmbed] })
      .catch(() => false);

    if (!sent) throw "couldn't send confession";

    const responseEmbed = embedTemplate()
      .setDescription(`Your confession has been sent to the confession channel!`);

    return { embeds: [responseEmbed], ephemeral: true };
  }
);

const isImageUrl = (text: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "apng", "webp", "gif", "avif"];
  try {
    let url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return false;

    let urlPath = path.parse(url.pathname);
    let extension = urlPath.ext.substring(1); // substring removes the leading dot from the extension
    return imageExtensions.indexOf(extension) != -1;
  } catch {
    return false;
  }
}
