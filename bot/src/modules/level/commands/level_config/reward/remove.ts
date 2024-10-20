import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";


export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove a role reward.",

    arguments: [
      {
        type: ApplicationCommandOptionType.Role,
        name: "role",
        description: "What role to add as reward.",
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
    const role = msg.options.getRole("role", true);

    await state.db.levelReward.delete({
      where: { roleId: role.id },
    });

    const embed = embedTemplate();
    embed.setDescription(`Successfully removed ${role} as a level reward.`);

    return { embeds: [embed] };
  }
);
