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

    const query = await state.db.birthdays.findFirst({
      where: {
        user_id: msg.user.id,
        NOT: { birthday: null },
      },
    });

    if (!query) {
      const response = failEmbed.setDescription(
        "You don't have a birthday registered anywhere else.",
      );
      return { embeds: [response] };
    }

    const result = await state.db.birthdays
      .create({
        data: {
          user_id: query.user_id,
          guild_id: msg.guildId,
          birthday: query.birthday,
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
