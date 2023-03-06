import { ApplicationCommandOptionType, GuildMember } from "discord.js";
import { embedTemplate, failEmbedTemplate } from "../../../lib/embedTemplate";
import { returnMessage, SubCommand } from "../../../types/Command";
import RavenInteraction from "../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "clear",
      description: "Remove timeout",

      arguments: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "User to remove from timeout",
          required: true,
        },
      ],

      botPermissions: ["ModerateMembers"],

      throttling: {
        duration: 60,
        usages: 3,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    const target = msg.options.getMember("user") as GuildMember | null;
    if (!target) return { content: "No user provided" };

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    if (!target.communicationDisabledUntil)
      return {
        ephemeral: true,
        embeds: [failEmbed.setDescription("This user isnt timed out.")],
      };

    await target.timeout(null);

    const response = embed.setDescription(
      `${target}'s timeout has been cleared`,
    );

    return { embeds: [response] };
  }
};
