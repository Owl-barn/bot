import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { localState } from "../../../";

export default SubCommand(

  // Info
  {
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
  },

  // Execute
  async (msg) => {
    if (!msg.guild) throw "no guild??";
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

    const guild = await state.db.guild.update({
      where: { id: msg.guild.id },
      data: { levelMessage: message },
    });

    localState.guilds.set(guild.id, guild);

    return { embeds: [embed] };
  }
);
