import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { state } from "@app";


export default SubCommand(

  // Info
  {
    name: "toggle",
    description: "toggles birthday in the current server",

    arguments: [
      {
        name: "state",
        description: "Whether to enable or disable your birthday here",
        type: ApplicationCommandOptionType.Boolean,
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
    const birthdayEnabled = msg.options.getBoolean("state", true);

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const hasBirthday = await state.db.user.findUnique({
      where: {
        id: msg.user.id,
      },
    });

    if (!hasBirthday) {
      failEmbed.setDescription("You must set your birthday first");
      return { embeds: [failEmbed] };
    }

    await state.db.userGuildConfig.upsert({
      where: { userId_guildId: { guildId: msg.guild.id, userId: msg.user.id } },
      create: { userId: msg.user.id, guildId: msg.guild.id, birthdayEnabled: true },
      update: { birthdayEnabled },
    });

    let description = `Your birthday is now ${birthdayEnabled ? "visible" : "hidden"} in this server`;

    if (!hasBirthday.birthdate) {
      description = "\n**note:** you have not set your birthday yet, please use `/birthday set` to set it";
    }

    embed.setTitle(`Birthday ${birthdayEnabled ? "Enabled" : "Disabled"}!`);
    embed.setDescription(description);

    return { embeds: [embed] };
  }
);
