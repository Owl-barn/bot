import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "set_message",
      description: "Set the level up message",

      arguments: [
        {
          type: ApplicationCommandOptionType.String,
          name: "message",
          description: "What to set the level up message to",
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
    let message = msg.options.getString("message");

    const embed = embedTemplate();

    if (message) {
      message = message.substring(0, 256);
      embed.setDescription(
        `Successfully set the level up message to: \`\`\`${message}\`\`\``,
      );
    } else {
      embed.setDescription("successfully disabled the level up message");
    }

    const guild = await msg.client.db.guilds.update({
      where: { guild_id: msg.guildId },
      data: { level_message: message },
    });
    GuildConfig.updateGuild(guild);

    return { embeds: [embed] };
  }
};
