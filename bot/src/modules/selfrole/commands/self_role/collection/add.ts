import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ApplicationCommandOptionType,
  ChannelType,
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
        allowedChannelTypes: [ChannelType.GuildText],
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
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "allow_multiple",
        description: "Whether to allow multiple roles to be selected, default: true.",
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
    const allowMultiple = msg.options.getBoolean("allow_multiple") ?? undefined;
    const channel = msg.options.getChannel(
      "channel",
      true,
    );

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
        allowMultiple,
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
