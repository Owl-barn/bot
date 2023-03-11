import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    if (!msg.guildId) throw "No guildID???";
    const channel = msg.options.getChannel("channel", true);
    const type = msg.options.getNumber("type", false);

    const guild = await state.db.guilds.update({
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

    state.guilds.set(guild.guild_id, guild);

    const embed = embedTemplate();
    embed.setDescription(
      `The bot will now send its event logs to <#${channel.id}>`,
    );

    return { embeds: [embed] };
  }
);
