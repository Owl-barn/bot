import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { Role } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "list",
    description: "show a list of the role rewards",

    throttling: {
      duration: 60,
      usages: 3,
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

    await state.db.levelReward.create({
      data: { guildId: msg.guildId, roleId: role.id, level },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully added ${role} as a level reward for level \`${level}\`.`,
    );

    return { embeds: [embed] };
  }
);
