import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "Remove an infraction from the moderation logs.",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "infraction_id",
        description: "The ID of the infraction to remove",
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
    const id = msg.options.getString("infraction_id", true);
    if (!msg.guild?.id) throw "No guild??";

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    const infraction = await state.db.infraction
      .update({
        where: {
          guildId_id: {
            guildId: msg.guild.id,
            id,
          },
        },
        data: {
          deletedOn: new Date(),
        },
      }).catch(() => null);

    if (!infraction) {
      const response = failEmbed.setDescription(
        "That infraction does not exist",
      );
      return { embeds: [response] };
    }

    embed.setTitle("Infraction Removed");
    embed.setDescription(
      `**ID:** \`${infraction.id}\`\n` +
      `**type:** \`${infraction.moderationType}\`\n` +
      `**user:** <@!${infraction.userId}>\n` +
      `**mod:** <@!${infraction.moderatorId}>\n` +
      `**reason:** *${infraction.reason}*\n` +
      `**Date:** <t:${Number(infraction.createdAt) / 1000}:R>`,
    );
    return { embeds: [embed] };
  }
);
