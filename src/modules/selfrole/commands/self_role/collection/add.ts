import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ApplicationCommandOptionType,
  ClientUser,
} from "discord.js";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a self role collection",

    arguments: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: "channel",
        description: "What channel to add the collection to.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "title",
        description: "What name to give the collection.",
        required: false,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: "description",
        description: "What description to give the collection.",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    const description = msg.options.getString("description");
    const title = msg.options.getString("title");
    const channel = msg.options.getChannel(
      "channel",
      true,
    );

    if (!channel.isTextBased())
      return {
        embeds: [failEmbedTemplate("Channel is not a text channel.")],
      };

    const canSend = channel
      .permissionsFor(msg.client.user as ClientUser)
      ?.has("SendMessages");

    if (!canSend)
      return {
        embeds: [
          failEmbedTemplate(
            "I do not have permission to send messages in this channel.",
          ),
        ],
      };

    const collection = await state.db.selfroleCollection.create({
      data: {
        guildId: msg.guildId,
        channelId: channel.id,
        title,
        description,
      },
    });

    const embed = embedTemplate();
    embed.setTitle("Collection added");
    embed.setDescription(
      `Collection \`${title}\` has been added.\n` +
      `**Collection ID:** ${collection.id}`,
    );

    return { embeds: [embed] };
  }
);
