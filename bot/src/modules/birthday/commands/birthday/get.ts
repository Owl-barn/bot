import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { formatBirthdayEmbed } from "@modules/birthday/lib/format";
import { User } from "@prisma/client";
import { getAvatar } from "@lib/functions";
import { isBirthdayVisible } from "@modules/birthday/lib/query";

export default SubCommand(

  // Info
  {
    name: "get",
    description: "See when it is your friends birthday",

    isGlobal: true,

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        description: "Who's birthday to get.",
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
    const target = msg.options.getUser("user") || msg.user;

    // Fetch the birthday.
    let query: Pick<User, "birthdate" | "timezone"> | null;
    if (!target.bot) {
      query = await state.db.user
        .findUnique({
          where: {
            id: target.id,
            birthdate: { not: null },
            ...isBirthdayVisible(msg, target.id),
          },
        })
        .then((res) => {
          if (res && !res.timezone) {
            res.timezone = "UTC";
          }
          return res;
        });
    } else {
      query = {
        birthdate: target.createdAt,
        timezone: "UTC",
      };
    }

    let embed = embedTemplate();
    const failEmbed = failEmbedTemplate();


    if (!query) {
      failEmbed.setDescription("This user has no birthday registered or its hidden in this context.");
      return { embeds: [failEmbed] };
    }

    embed.setTitle(`${target.displayName}'s birthday`);
    if (query.birthdate === null || !query.timezone) throw new Error("No date???");
    embed = formatBirthdayEmbed(embed, { birthdate: query.birthdate, timezone: query.timezone });
    embed.setThumbnail(getAvatar(target) || null);

    return { embeds: [embed] };
  }
);
