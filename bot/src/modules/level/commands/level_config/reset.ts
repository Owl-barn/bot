import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "reset",
    description: "Reset all user levels.",

    userPermissions: ["Administrator"],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const deleted = await state.db.level.deleteMany({
      where: { guildId: msg.guildId },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully deleted \`${deleted.count}\` user levels`,
    );

    return { embeds: [embed] };
  }
);
