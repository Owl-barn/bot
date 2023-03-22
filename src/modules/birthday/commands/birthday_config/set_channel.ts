import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import {
  GuildBasedChannel,
  ClientUser,
  ApplicationCommandOptionType,
} from "discord.js";

export default SubCommand(

  // Info
  {
    name: "set_channel",
    description: "Set the channel for the birthday announcements",

    arguments: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: "birthday_channel",
        description: "Where to send happy birthday messages.",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const channel = msg.options.getChannel("birthdayChannelId") as
      | GuildBasedChannel
      | undefined;

    const failEmbed = failEmbedTemplate("I cant assign this role.");

    if (channel && !channel.permissionsFor(msg.client.user as ClientUser))
      return { embeds: [failEmbed] };

    await state.db.guild.update({
      where: { id: msg.guildId },
      data: { birthdayChannelId: channel?.id || null },
    });

    const embed = embedTemplate(
      channel
        ? `Successfully set ${channel} as the birthday message channel!`
        : "Birthday channel removed.",
    );

    return { embeds: [embed] };
  }

);
