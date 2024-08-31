import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { formatBirthdayEmbed } from "@modules/birthday/lib/format";
import { User } from "@prisma/client";
import { getAvatar } from "@lib/functions";

export default SubCommand(

  // Info
  {
    name: "get",
    description: "See when it is your friends birthday",

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
    let member = msg.options.getMember("user");

    if (!member) member = msg.member as GuildMember;

    // Fetch the birthday.
    let query: Pick<User, "birthdate" | "timezone"> | null;
    if (!member.user.bot) {
      query = await state.db.user
        .findUnique({
          where: {
            id: member.id,
            birthdate: { not: null },
            UserGuildConfig: {
              some: {
                guildId: msg.guild.id,
                birthdayEnabled: true,
              },
            },
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
        birthdate: member.user.createdAt,
        timezone: "UTC",
      };
    }

    let embed = embedTemplate();
    const failEmbed = failEmbedTemplate();


    if (!query) {
      failEmbed.setDescription("This user has no birthday registered");
      return { embeds: [failEmbed] };
    }

    embed.setTitle(`${member.user.username}'s birthday`);
    if (query.birthdate === null || !query.timezone) throw new Error("No date???");
    embed = formatBirthdayEmbed(embed, { birthdate: query.birthdate, timezone: query.timezone });
    embed.setThumbnail(getAvatar(member) || null);

    return { embeds: [embed] };
  }
);
