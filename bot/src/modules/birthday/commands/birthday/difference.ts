import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { getDateTime } from "@modules/birthday/lib/format";
import { canUserViewBirthday } from "@modules/birthday/lib/query";
import { User } from "@prisma/client";

export default SubCommand(

  // Info
  {
    name: "difference",
    description:
      "get the difference between your birthday and another user's",

    isGlobal: true,

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

    const first_user = msg.options.getUser("first_user", true);

    if (first_user === null) throw "No first user?";
    let second_user = msg.options.getUser("second_user");

    const embed = embedTemplate();
    const failEmbed = failEmbedTemplate();

    if (!second_user) second_user = msg.user;

    async function fetchUser(id: string) {
      return state.db.user.findUnique({
        where: {
          id: id,
          birthdate: { not: null },
          ...canUserViewBirthday(msg.guildId, id, msg.user.id),
        },
      });
    }

    const users = ([await fetchUser(first_user.id), await fetchUser(second_user.id)]
      .filter(x => x !== null) as User[])
      .sort((a, b) => Number(a.birthdate) - Number(b.birthdate));

    if (users.length < 2) {
      const response = failEmbed.setDescription(
        "One or more of you don't have a birthday registered.",
      );
      return { embeds: [response] };
    }

    const user1 = users[0];
    const user2 = users[1];

    if (user1.birthdate === null || user2.birthdate === null) throw Error("Missing date?");

    const user0_date = getDateTime(user1.birthdate, user1.timezone).toJSDate();
    const user1_date = getDateTime(user2.birthdate, user2.timezone).toJSDate();

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
      user1.id === second_user.id ? second_user : first_user;

    const youngest =
      user2.id === second_user.id ? second_user : first_user;

    embed.addFields([
      {
        name: `Who is older?`,
        value: `${oldest} is older than ${youngest} by ${differenceString} ${percent_difference > 0.15 ? `(sussy)` : ""}`,
      },
    ]);

    return { embeds: [embed] };
  }
);
