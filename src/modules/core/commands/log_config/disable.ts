import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "disable",
    description: "Disables the event logging",

    arguments: [
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
    const type = msg.options.getNumber("type", false);

    const guild = await state.db.guilds.update({
      where: { guild_id: msg.guildId },
      data:
        type === null
          ? {
            log_events: null,
            log_bot: null,
            log_join_leave: null,
          }
          : {
            log_events: type === 0 ? null : undefined,
            log_bot: type === 1 ? null : undefined,
            log_join_leave: type === 2 ? null : undefined,
          },
    });

    state.guilds.set(guild.guild_id, guild);

    const embed = embedTemplate();
    embed.setDescription(`The bot will no longer send logs.`);

    return { embeds: [embed] };
  }
);
