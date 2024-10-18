import { state } from "@app";
import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { localState } from "@modules/level";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "top",
    description: "View the server leaderboard.",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const config = state.guilds.get(msg.guildId);
    if (!config || !config.levelSystemEnabled) {
      const response = failEmbed.setDescription(
        "Leveling is not enabled on this server.",
      );
      return { embeds: [response] };
    }

    const levels = await state.db.level.findMany({
      where: { guildId: msg.guildId },
      orderBy: { experience: "desc" },
    });

    const top = levels.slice(0, 10);

    embed.setTitle(`${msg.guild?.name} leaderboard`);

    embed.setDescription(
      top.map((x, i) => `${i + 1}. <@${x.userId}> - Level ${localState.controller.getLevelFromXP(x.experience).level}`)
        .join("\n")
    );

    const userIndex = levels.findIndex(x => x.userId === msg.user.id);
    if (userIndex === -1 || userIndex > 10) {
      embed.addFields({
        name: "Your rank",
        value: userIndex === -1 ? "Not ranked" : (userIndex + 1).toString(),
      });
    }

    return { embeds: [embed] };
  }

);
