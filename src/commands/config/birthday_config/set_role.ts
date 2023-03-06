import { ApplicationCommandOptionType, Role } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
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
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";

    const role = msg.options.getRole("birthday_role") as Role | undefined;

    const failEmbed = failEmbedTemplate("I cant assign this role.");

    if (role && !role.editable) return { embeds: [failEmbed] };

    await msg.client.db.guilds.update({
      where: { guild_id: msg.guildId },
      data: { birthday_role: role?.id || null },
    });

    const embed = embedTemplate(
      role
        ? `Successfully set ${role} as the birthday auto role!`
        : "Birthday role removed.",
    );

    return { embeds: [embed] };
  }
};
