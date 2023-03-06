import { ApplicationCommandOptionType } from "discord.js";
import { embedTemplate } from "../../../../lib/embedTemplate";
import GuildConfig from "../../../../lib/guildconfig.service";
import { returnMessage, SubCommand } from "../../../../types/Command";
import RavenInteraction from "../../../../types/interaction";

module.exports = class extends SubCommand {
  constructor() {
    super({
      name: "set_channel",
      description: "Set the channel to send the logs to",

      arguments: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "The channel to send the logs to.",
          required: true,
        },
        {
          name: "type",
          description: "The type of logging",
          type: ApplicationCommandOptionType.Number,
          choices: [
            { name: "Events", value: 0 },
            { name: "Bot", value: 1 },
            { name: "Join/Leave", value: 2 },
          ],
          required: false,
        },
      ],

      throttling: {
        duration: 60,
        usages: 2,
      },
    });
  }

  async execute(msg: RavenInteraction): Promise<returnMessage> {
    if (!msg.guildId) throw "No guildID???";
    const channel = msg.options.getChannel("channel", true);
    const type = msg.options.getNumber("type", false);

    const guild = await msg.client.db.guilds.update({
      where: { guild_id: msg.guildId },
      data:
                type === null
                  ? {
                    log_events: channel.id,
                    log_bot: channel.id,
                    log_join_leave: channel.id,
                  }
                  : {
                    log_events: type === 0 ? channel.id : undefined,
                    log_bot: type === 1 ? channel.id : undefined,
                    log_join_leave: type === 2 ? channel.id : undefined,
                  },
    });

    await GuildConfig.updateGuild(guild);

    const embed = embedTemplate();
    embed.setDescription(
      `The bot will now send its event logs to <#${channel.id}>`,
    );

    return { embeds: [embed] };
  }
};
