import { embedTemplate, failEmbedTemplate } from "@lib/embedTemplate";
import { nextDate } from "@lib/time";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";

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
    let birthdays = await state.db.birthday.findMany({
      where: {
        guildId: msg.guildId,
        NOT: { date: null },
      },
    });


    if (!birthdays.length) {
      const failEmbed = failEmbedTemplate();
      failEmbed.setDescription("This server has no birthdays registered");
      return { embeds: [failEmbed] };
    }

    birthdays = birthdays.map(b => ({ ...b, date: nextDate(new Date(b.date as Date)) }));
    birthdays = birthdays.sort((x, y) => Number(x.date) - Number(y.date));
    birthdays = birthdays.slice(0, 10);

    const embed = embedTemplate();
    embed.setTitle(`Upcoming birthdays`);
    embed.setDescription(birthdays.map((b, i) => `${i}. <@${b.userId}> - <t:${Math.round(Number(b.date) / 1000)}:R>`).join("\n"));

    return { embeds: [embed] };
  }
);
