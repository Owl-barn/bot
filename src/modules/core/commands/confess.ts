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

    const imageUrl = await getImageUrl(confession);
    if (imageUrl) {
      confessionEmbed.setImage(imageUrl);
    }

    const sent = await confessionChannel.send({ embeds: [confessionEmbed] })
      .catch(() => false);

    if (!sent) throw "couldn't send confession";

    const responseEmbed = embedTemplate()
      .setDescription(`Your confession has been sent to the confession channel!`);

    return { embeds: [responseEmbed], ephemeral: true };
  }
);

const tenorRegex = /https:\/\/tenor.com\/.*\/view\/.*-[0-9]+/;
const getImageUrl = async (text: string): Promise<string | undefined> => {
  if (text.startsWith("https://tenor.com") && text.match(tenorRegex)) {
    // find out gif name from URL
    // last part of the URL
    let gifName = text.split("/").pop()!;
    // remove the "-gif-23456789" part
    gifName = gifName.split("-").slice(0, -2).join("-");
    // make a GET request to the URL
    let response = await fetch(text);
    let data = await response.text();
    // find the GIF URL
    let regex = new RegExp(`https:\\/\\/media[0-9]?.tenor.com\\/.{16}\\/${gifName}\\.gif`, "g");
    if (data.match(regex)) {
      return data.match(regex)![0];
    }
  }
  const imageExtensions = ["jpg", "jpeg", "png", "apng", "webp", "gif", "avif"];
  try {
    let url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return undefined;

    let urlPath = path.parse(url.pathname);
    let extension = urlPath.ext.substring(1); // substring removes the leading dot from the extension
    if (imageExtensions.indexOf(extension) != -1) {
      return text;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
