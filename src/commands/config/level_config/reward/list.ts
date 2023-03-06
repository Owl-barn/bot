import { Role } from "discord.js";
import {
  failEmbedTemplate,
  embedTemplate,
} from "../../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "list",
      description: "show a list of the role rewards",

      throttling: {
        duration: 60,
        usages: 3,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "no guild??";
    const level = msg.options.getInteger("level", true);
    const role = msg.options.getRole("role", true) as Role;

    const failEmbed = failEmbedTemplate();

    if (!role.editable)
      return {
        embeds: [failEmbed.setDescription("I cant assign that role")],
      };

    await msg.client.db.level_reward.create({
      data: { guild_id: msg.guildId, role_id: role.id, level },
    });

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully added ${role} as a level reward for level \`${level}\`.`,
    );

    return { embeds: [embed] };
  }
};
