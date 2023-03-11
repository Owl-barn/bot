import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, Role } from "discord.js";


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
    if (!msg.guildId) throw "no guild??";
    const role = msg.options.getRole("role", true) as Role;

    await state.db.level_reward.delete({
      where: { role_id: role.id },
    });

    const embed = embedTemplate();
    embed.setDescription(`Successfully removed ${role} as a level reward.`);

    return { embeds: [embed] };
  }
);
