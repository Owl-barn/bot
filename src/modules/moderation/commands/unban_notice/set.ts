import { embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, escapeMarkdown } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "set",
    description: "Sets the unban notice.",

    botPermissions: ["BanMembers"],

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "unban_notice",
        description: "The unban notice",
        required: true,
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
    let unban_notice = msg.options.getString("unban_notice", true);
    unban_notice = escapeMarkdown(unban_notice).substring(0, 255);

    await state.db.guilds.update({
      where: { guild_id: msg.guildId },
      data: { unban_notice },
    });

    const embed = embedTemplate()
      .setTitle("Unban Notice Set")
      .setDescription(
        `The unban notice is now:\n\`\`\`${unban_notice}\`\`\``,
      );

    return { embeds: [embed] };
  }

);
