import {
  ApplicationCommandOptionType,
  ChannelType,
  ClientUser,
  GuildBasedChannel,
} from "discord.js";
import {
  failEmbedTemplate,
  embedTemplate,
} from "../../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
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
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "description",
          description: "What description to give the collection.",
          required: true,
        },
      ],

      throttling: {
        duration: 60,
        usages: 1,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const db = msg.client.db;

    const description = msg.options.getString("description", true);
    const title = msg.options.getString("title", true);
    const channel = msg.options.getChannel(
      "channel",
      true,
    ) as GuildBasedChannel;

    if (channel.type !== ChannelType.GuildText)
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

    const collection = await db.self_role_main.create({
      data: {
        guild_id: msg.guildId,
        channel_id: channel.id,
        title,
        description,
      },
    });

    const embed = embedTemplate();
    embed.setTitle("Collection added");
    embed.setDescription(
      `Collection \`${title}\` has been added.\n` +
                `**Collection ID:** ${collection.uuid}`,
    );

    return { embeds: [embed] };
  }
};
