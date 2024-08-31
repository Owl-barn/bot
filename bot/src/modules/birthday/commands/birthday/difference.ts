import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { GuildMember, ApplicationCommandOptionType } from "discord.js";
import { getDateTime } from "@modules/birthday/lib/format";

export default SubCommand(

  // Info
  {
    name: "difference",
    description:
      "get the difference between your birthday and another user's",

    arguments: [
      {
        type: ApplicationCommandOptionType.User,
        name: "first_user",
        description: "Who's birthday to compare",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "second_user",
        description: "Who's birthday to compare",
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

    const first_user = msg.options.getMember("first_user") as GuildMember | null;

    if (first_user === null) throw "No first user?";
    let second_user = msg.options.getMember("second_user") as
      | GuildMember
      | undefined;

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    if (!second_user) second_user = msg.member as GuildMember;

    const users = await state.db.user.findMany({
      where: {
        OR: [{ id: first_user.id }, { id: second_user.id }],
        birthdate: { not: null },
        UserGuildConfig: {
          some: {
            guildId: msg.guild.id,
            birthdayEnabled: true,
          },
        },
      },
      orderBy: { birthdate: "asc" },
    });

    if (users.length !== 2) {
      const response = failEmbed.setDescription(
        "One or more of you don't have a birthday registered.",
      );
      return { embeds: [response] };
    }

    if (users[0].birthdate === null || users[1].birthdate === null) throw Error("Missing date?");

    const user0_date = getDateTime(users[0].birthdate, users[0].timezone).toJSDate();
    const user1_date = getDateTime(users[1].birthdate, users[1].timezone).toJSDate();

    const user0_age = Number(new Date()) - Number(user0_date);
    const user1_age = Number(new Date()) - Number(user1_date);

    const percent_difference =
      (Math.abs(user0_age - user1_age) /
        Math.max(user0_age + user1_age, 0.0001)) *
      2;

    const difference = Math.abs(
      (Number(user0_date) - Number(user1_date)) /
      (1000 * 60 * 60 * 24),
    );

    const years = Math.floor(difference / 365);
    const days = Math.floor(difference % 365);

    const yearString = years ? `${years} year${years == 1 ? "" : "s"}` : "";
    const dayString = `${days} day${days == 1 ? "" : "s"}`;
    const differenceString = years
      ? `${yearString} and ${dayString}`
      : dayString;

    const oldest =
      users[0].id === second_user.id ? second_user : first_user;

    const youngest =
      users[1].id === second_user.id ? second_user : first_user;

    embed.addFields([
      {
        name: `Who is older?`,
        value: `${oldest} is older than ${youngest} by ${differenceString} ${percent_difference > 0.15 ? `(sussy)` : ""}`,
      },
    ]);

    return { embeds: [embed] };
  }
);
