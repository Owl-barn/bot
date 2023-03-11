import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { getStarSign } from "@lib/functions";
import { nextDate, yearsAgo } from "@lib/time";
import { state } from "@src/app";
import { SubCommand } from "@structs/command/subcommand";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import moment from "moment";

export default SubCommand(

  // Info
  {
    name: "get",
    description: "See when it is your friends birthday!",

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
    if (!msg.guildId) throw "No guildID???";
    let user = msg.options.getMember("user") as GuildMember | undefined;

    if (!user) user = msg.member as GuildMember;

    // Fetch the birthday.
    let query: { birthday: Date | null } | null;
    if (!user.user.bot) {
      query = await state.db.birthdays.findUnique({
        where: {
          user_id_guild_id: {
            user_id: user.id,
            guild_id: msg.guildId,
          },
        },
      });
    } else {
      query = {
        birthday: user.user.createdAt,
      };
    }

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    embed.setTitle(`${user.user.username}'s birthday`);

    if (!query?.birthday) {
      failEmbed.setDescription("This user has no birthday registered");
      return { embeds: [failEmbed] };
    }

    // Transform data.
    const nextBirthday = nextDate(new Date(query.birthday));
    const age = yearsAgo(query.birthday);
    const starSign = getStarSign(query.birthday);

    const userString =
      user.id === msg.user.id ? `you were` : `<@!${user.id}> was`;

    const birthdayString = moment(query.birthday).format("DD-MM-YYYY");

    // Format the response.
    embed.addFields([
      {
        name: `Birth Date`,
        value: `**${userString} born on** ${birthdayString}`,
      },
      {
        name: "Info",
        value:
          `**Age:** ${age} years\n` +
          `**Next birthday:** <t:${Math.round(
            Number(nextBirthday) / 1000,
          )}:R>`,
        inline: true,
      },
      {
        name: "Star Sign",
        value: `${starSign?.name} ${starSign?.icon}`,
        inline: true,
      },
      {
        name: "Note",
        value: "All times are recorded in UTC timezone. The “next birthday” and birthday role times may be inaccurate due to this.",
      },
    ]);

    return { embeds: [embed] };
  }
);