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

    const guild = await state.db.guild.update({
      where: { id: msg.guildId },
      data:
        type === null
          ? {
            logEvents: null,
            logBot: null,
            logJoinLeave: null,
          }
          : {
            logEvents: type === 0 ? null : undefined,
            logBot: type === 1 ? null : undefined,
            logJoinLeave: type === 2 ? null : undefined,
          },
    });

    state.guilds.set(guild.id, guild);

    const embed = embedTemplate();
    embed.setDescription(`The bot will no longer send logs.`);

    return { embeds: [embed] };
  }
);
