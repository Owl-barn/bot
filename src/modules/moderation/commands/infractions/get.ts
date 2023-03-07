import { failEmbedTemplate } from "@lib/embedTemplate";
import { env } from "@lib/env";
import { getAvatar } from "@lib/functions";
import { formatInfraction } from "@modules/moderation/lib/formatinfraction";
import { moderation_type } from "@prisma/client";
import { state } from "@src/app";
import { SubCommand } from "@structs/command/subcommand";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  HexColorString,
} from "discord.js";

export default SubCommand(

  // Info
  {
    name: "get",
    description: "View the infractions a user has had.",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "User to view infractions for",
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
    let target = msg.options.getUser("user");
    target = target ?? msg.user;

    const failEmbed = failEmbedTemplate();

    if (!target)
      return { embeds: [failEmbed.setDescription("No user provided")] };

    const logs = await state.db.moderation_log.findMany({
      where: {
        user: target.id,
        guild_id: msg.guildId as string,
        deleted: false,
        OR: [
          { moderation_type: { not: moderation_type.warn } },
          {
            moderation_type: moderation_type.warn,
            OR: [
              { expiry: { equals: null } },
              { expiry: { gt: new Date() } },
            ],
          },
        ],
      },
      orderBy: {
        created: "asc",
      },
    });

    const logList = logs.map((infraction, x) => ({
      name: `#${x + 1}`,
      value: formatInfraction(infraction),
      inline: true,
    }));

    let colour: HexColorString;

    switch (logList.length) {
      case 0:
        colour = env.EMBED_COLOR;
        break;
      case 1:
        colour = "#18ac15";
        break;
      case 2:
        colour = "#d7b500";
        break;
      default:
        colour = "#e60008";
        break;
    }

    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: `${target.tag} has ${logs.length} infractions.`,
      iconURL: getAvatar(target),
    });
    embed.setColor(colour);

    logList.length !== 0
      ? embed.addFields(logList)
      : embed.setDescription("This user has no infractions.");

    return { embeds: [embed] };
  }
);
