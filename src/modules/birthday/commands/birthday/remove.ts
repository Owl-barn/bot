import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";


export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove your birthday from this server",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "No guildID in remove_birthday??";

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const query = await state.db.birthday.updateMany({
      where: {
        userId: msg.user.id,
        guildId: msg.guildId,
        NOT: { date: null },
      },
      data: { date: null },
    });

    if (!query || query.count === 0)
      return { embeds: [failEmbed.setDescription("No birthday set")] };

    return {
      embeds: [embed.setDescription("Birthday removed successfully!")],
    };
  }

);
