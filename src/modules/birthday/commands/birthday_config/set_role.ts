import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, Role } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "set_role",
    description: "Set the role for the birthday announcements",

    arguments: [
      {
        type: ApplicationCommandOptionType.Role,
        name: "birthday_role",
        description: "What role to set as birthday role.",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const role = msg.options.getRole("birthdayRoleId") as Role | undefined;

    const failEmbed = failEmbedTemplate("I cant assign this role.");

    if (role && !role.editable) return { embeds: [failEmbed] };

    await state.db.guild.update({
      where: { id: msg.guildId },
      data: { birthdayRoleId: role?.id || null },
    });

    const embed = embedTemplate(
      role
        ? `Successfully set ${role} as the birthday auto role!`
        : "Birthday role removed.",
    );

    return { embeds: [embed] };
  }

);
