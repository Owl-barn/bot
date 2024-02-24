import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "reset",
    description: "Reset all role rewards.",

    userPermissions: ["Administrator"],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const deleted = await state.db.levelReward.deleteMany({
      where: { guildId: msg.guildId },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully removed ${deleted.count} level rewards.`,
    );

    return { embeds: [embed] };
  }
);
