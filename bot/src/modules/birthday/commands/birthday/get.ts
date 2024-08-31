import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { formatBirthdayEmbed } from "@modules/birthday/lib/format";
import { Birthday } from "@prisma/client";

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
    let query: Pick<Birthday, "date" | "timezone"> | null;
    if (!member.user.bot) {
      query = await state.db.birthday.findUnique({
        where: {
          userId_guildId: {
            userId: member.id,
            guildId: msg.guildId,
          },
        },
      });
    } else {
      query = {
        date: member.user.createdAt,
        timezone: "UTC",
      };
    }

    let embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    embed.setTitle(`${member.user.username}'s birthday`);

    if (!query) {
      failEmbed.setDescription("This user has no birthday registered");
      return { embeds: [failEmbed] };
    }

    embed = formatBirthdayEmbed(embed, query);

    return { embeds: [embed] };
  }
);
