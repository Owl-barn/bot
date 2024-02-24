import { failEmbedTemplate } from "@lib/embedTemplate";
import { getAvatar } from "@lib/functions";
import { ModerationType } from "@prisma/client";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { formatInfraction } from "../../lib/formatinfraction";
import { getColour } from "modules/moderation/lib/getColour";

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

    const logs = await state.db.infraction.findMany({
      where: {
        userId: target.id,
        guildId: msg.guildId as string,
        deletedOn: null,
        OR: [
          { moderationType: { not: ModerationType.warn } },
          {
            moderationType: ModerationType.warn,
            OR: [
              { expiresOn: { equals: null } },
              { expiresOn: { gt: new Date() } },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const logList = logs.map((infraction, x) => ({
      name: `#${x + 1}`,
      value: formatInfraction(infraction),
      inline: true,
    }));


    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: `${target.tag} has ${logs.length} infractions.`,
      iconURL: getAvatar(target),
    });
    embed.setColor(getColour(logList.length));

    logList.length !== 0
      ? embed.addFields(logList)
      : embed.setDescription("This user has no infractions.");

    return { embeds: [embed] };
  }
);
