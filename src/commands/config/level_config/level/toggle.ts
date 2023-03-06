import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "toggle",
      description: "Toggle the level system",

      arguments: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "state",
          description: "turn the level sytem on or off?",
          required: true,
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
    const state = msg.options.getBoolean("state", true);

    const guild = await msg.client.db.guilds.update({
      where: { guild_id: msg.guildId },
      data: { level: state },
    });

    GuildConfig.updateGuild(guild);

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully toggled the level system, it is now \`${
        state ? "on" : "off"
      }\``,
    );

    return { embeds: [embed] };
  }
};
