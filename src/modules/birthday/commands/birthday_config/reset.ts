import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "reset",
    description: "Reset a user's birthday and their birthday timeout.",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "Who to reset.",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "no guild??";
    const user = msg.options.getUser("user", true);

    await state.db.birthdays.delete({
      where: {
        user_id_guild_id: { guild_id: msg.guildId, user_id: user.id },
      },
    });

    const embed = embedTemplate(
      `Successfully reset <@${user.id}>'s birthday`,
    );

    return { embeds: [embed] };
  }

);
