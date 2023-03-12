import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "no guild??";
    const level = msg.options.getBoolean("state", true);

    const guild = await state.db.guild.update({
      where: { id: msg.guild.id },
      data: { level },
    });

    state.guilds.set(guild.id, guild);

    const embed = embedTemplate();
    embed.setDescription(
      `Successfully toggled the level system, it is now \`${level ? "on" : "off"
      }\``,
    );

    return { embeds: [embed] };
  }
);
