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
    let unbanNotice = msg.options.getString("unbanNotice", true);
    unbanNotice = escapeMarkdown(unbanNotice).substring(0, 255);

    await state.db.guild.update({
      where: { id: msg.guildId },
      data: { unbanNotice },
    });

    const embed = embedTemplate()
      .setTitle("Unban Notice Set")
      .setDescription(
        `The unban notice is now:\n\`\`\`${unbanNotice}\`\`\``,
      );

    return { embeds: [embed] };
  }

);
