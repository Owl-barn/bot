import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { nextDate } from "@lib/time";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { getDateTime } from "@modules/birthday/lib/format";
import { User } from "@prisma/client";

export default SubCommand(

  // Info
  {
    name: "upcoming",
    description: "See the upcoming birthdays in this server",

    throttling: {
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    let birthdays = await state.db.user.findMany({
      where: {
        birthdate: { not: null },
        UserGuildConfig: {
          some: {
            guildId: msg.guild.id,
            birthdayEnabled: true,
          },
        },
      },
    }) as (Omit<User, "birthdate"> & { birthdate: Date })[];


    if (!birthdays.length) {
      const failEmbed = failEmbedTemplate();
      failEmbed.setDescription("This server has no birthdays registered");
      return { embeds: [failEmbed] };
    }

    birthdays = birthdays.map(b => ({ ...b, birthdate: nextDate(getDateTime(b.birthdate, b.timezone).toJSDate()) }));
    birthdays = birthdays.sort((x, y) => Number(x.birthdate) - Number(y.birthdate));

    // Check if users are still in server
    const users = await msg.guild.members.fetch({ user: birthdays.map(b => b.id) });
    birthdays = birthdays.filter(b => users.has(b.id));
    birthdays = birthdays.slice(0, 10);

    const embed = embedTemplate();
    embed.setTitle(`Upcoming birthdays`);
    embed.setDescription(birthdays.map((b, i) => `${i}. ${users.get(b.id)?.displayName} - <t:${Math.round(Number(b.birthdate) / 1000)}:R>`).join("\n"));

    return { embeds: [embed] };
  }
);
