import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

export default SubCommand(

  // Info
  {
    name: "sync",
    description: "Fetch birthday from other server.",

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "No guildID???";

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const query = await state.db.birthday.findFirst({
      where: {
        userId: msg.user.id,
        NOT: { date: null },
      },
    });

    if (!query) {
      const response = failEmbed.setDescription(
        "You don't have a birthday registered anywhere else.",
      );
      return { embeds: [response] };
    }

    const result = await state.db.birthday
      .create({
        data: {
          userId: query.userId,
          guildId: msg.guildId,
          date: query.date,
        },
      })
      .catch(() => null);

    if (!result) {
      const response = failEmbed.setDescription(
        "You already have a birthday registered here",
      );
      return { embeds: [response] };
    }

    return {
      embeds: [embed.setDescription("birthday has been transferred!")],
    };
  }

);
