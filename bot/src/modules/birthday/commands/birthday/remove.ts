import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";


export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove your birthday from the bot entirely",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const query = await state.db.user.update({
      where: {
        id: msg.user.id,
        birthdate: { not: null },
      },
      data: {
        birthdate: null,
        timezone: null,
      },
    });

    if (!query)
      return { embeds: [failEmbed.setDescription("No birthday set")] };

    return {
      embeds: [embed.setDescription("Birthday removed successfully!")],
    };
  }

);
