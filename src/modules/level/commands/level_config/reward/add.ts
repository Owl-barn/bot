import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, Role } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "add",
    description: "Add a role reward.",

    arguments: [
      {
        type: ApplicationCommandOptionType.Role,
        name: "role",
        description: "What role to add as reward.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: "level",
        description: "What level to add a reward to.",
        required: true,
      },
    ],

    throttling: {
      duration: 60,
      usages: 10,
    },
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "no guild??";
    const level = msg.options.getInteger("level", true);
    const role = msg.options.getRole("role", true) as Role;

    const failEmbed = failEmbedTemplate();

    if (!role.editable)
      return {
        embeds: [failEmbed.setDescription("I cant assign that role")],
      };

    await state.db.level_reward.create({
      data: { guild_id: msg.guildId, role_id: role.id, level },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully added ${role} as a level reward for level \`${level}\`.`,
    );

    return { embeds: [embed] };
  }
);
