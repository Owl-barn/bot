import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "set_modifier",
    description: "Change the rate at which XP is gained.",

    arguments: [
      {
        type: ApplicationCommandOptionType.Number,
        name: "modifier",
        description: "What factor to multiply the xp by.",
        min: 0.1,
        max: 5,
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
    const levelModifier = msg.options.getNumber("modifier", true);


    const guild = await state.db.guild.update({
      where: { id: msg.guild.id },
      data: { levelModifier },
    });

    state.guilds.set(guild.id, guild);

    const embed = embedTemplate(`Successfully set the level modifier to: ${levelModifier}x`);
    return { embeds: [embed] };
  }
);
