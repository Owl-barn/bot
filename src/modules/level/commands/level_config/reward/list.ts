import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "show a list of the role rewards",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {

    const roles = await state.db.levelReward.findMany({ where: { guildId: msg.guild.id } });

    const embed = embedTemplate();
    embed.setTitle("Level Rewards");

    if (roles.length === 0) {
      embed.setDescription("There are no role rewards set up.");
    } else {
      embed.setDescription("List of role rewards: " + roles.map((role) => `<@&${role.roleId}>`).join(", "));
    }


    return { embeds: [embed] };
  }
);
