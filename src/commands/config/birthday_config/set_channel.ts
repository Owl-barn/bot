import {
  GuildBasedChannel,
  ClientUser,
  ApplicationCommandOptionType,
} from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
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
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const channel = msg.options.getChannel("birthday_channel") as
            | GuildBasedChannel
            | undefined;

    const failEmbed = failEmbedTemplate("I cant assign this role.");

    if (channel && !channel.permissionsFor(msg.client.user as ClientUser))
      return { embeds: [failEmbed] };

    await msg.client.db.guilds.update({
      where: { guild_id: msg.guildId },
      data: { birthday_channel: channel?.id || null },
    });

    const embed = embedTemplate(
      channel
        ? `Successfully set ${channel} as the birthday message channel!`
        : "Birthday channel removed.",
    );

    return { embeds: [embed] };
  }
};
