import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "limit",
    description: "Sets the private voice channel limit",

    arguments: [
      {
        name: "limit",
        type: ApplicationCommandOptionType.Integer,
        min: 0,
        max: 10,
        description: "The limit of private voice channels",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const limit = msg.options.getInteger("limit", true);

    const guild = await state.db.guild.update({
      where: { id: msg.guild.id },
      data: { privateRoomLimit: limit },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully set the private voice channel limit to ${guild.privateRoomLimit}`,
    );

    return { embeds: [embed] };
  }

);
