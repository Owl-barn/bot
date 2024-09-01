import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { removeBirthdayRoles } from "@modules/birthday/lib/removeRoles";
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

    const user = await state.db.user.findUnique({ where: { id: msg.user.id, birthdate: { not: null } } });

    if (!user)
      return { embeds: [failEmbed.setDescription("No birthday set")] };


    // Check if the user has set their birthday within the lockout, if so reset it.
    let birthdayUpdatedAt: undefined | null = undefined;
    if (Date.now() - Number(user.birthdayUpdatedAt) < state.env.BIRTHDAY_LOCKOUT_MINUTES * 60 * 1000) {
      birthdayUpdatedAt = null;
    }

    // Remove the birthday from the database.
    await state.db.user.update({
      where: {
        id: msg.user.id,
        birthdate: { not: null },
      },
      data: {
        birthdate: null,
        timezone: null,
        birthdayUpdatedAt,
      },
    });

    // Check if the user has an active birthday role and remove it.
    const userGuildConfig = await state.db.userGuildConfig.findMany({
      where: {
        userId: msg.user.id,
        birthdayHasRole: true,
      },
      include: {
        guild: true,
        user: true,
      },
    });

    if (userGuildConfig.length !== 0) {
      localState.log.info("User with active birthday role removed their birthday.");
      await removeBirthdayRoles(userGuildConfig).catch(() => null);
    }

    return {
      embeds: [embed.setDescription("Birthday removed successfully!")],
    };
  }

);
