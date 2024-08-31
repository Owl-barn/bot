import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { removeBirthdayRole } from "@modules/birthday/lib/removeRoles";
import { localState } from "@modules/birthday";


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

    const userGuildConfig = await state.db.userGuildConfig.findUnique({
      where: {
        userId_guildId: {
          userId: msg.user.id,
          guildId: msg.guild.id,
        },
      },
      include: {
        guild: true,
        user: true,
      },
    });

    if (userGuildConfig?.birthdayHasRole) {
      localState.log.info("User with active birthday role removed their birthday.");
      removeBirthdayRole(userGuildConfig).catch(() => null);
    }

    return {
      embeds: [embed.setDescription("Birthday removed successfully!")],
    };
  }

);
