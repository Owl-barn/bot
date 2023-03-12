import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "set_channel",
    description: "Set the channel for level up messages",

    arguments: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: "channel",
        description: "What to set the level up channel to",
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
    if (!msg.guildId) throw "no guild??";
    const channel = msg.options.getChannel("channel");

    const embed = embedTemplate();

    channel
      ? embed.setDescription(
        `Successfully set the level up channel to ${channel}`,
      )
      : embed.setDescription(
        "successfully disabled the level up channel",
      );

    const guild = await state.db.guild.update({
      where: { id: msg.guildId },
      data: { levelChannelId: channel?.id },
    });

    state.guilds.set(guild.id, guild);

    return { embeds: [embed] };
  }
);
