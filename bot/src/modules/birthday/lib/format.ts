import { getStarSign } from "@lib/functions";
import { yearsAgo, nextDate } from "@lib/time";
import { EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";

export function getDateTime(date: Date, timezone: string | null) {
  if (timezone === null) timezone = "UTC";
  return DateTime.fromJSDate(date).setZone(timezone, { keepLocalTime: true });
}

export function formatBirthdayEmbed(embed: EmbedBuilder, birthday: { birthdate: Date, timezone: string }) {
  const date = getDateTime(birthday.birthdate, birthday.timezone);
  const jsDate = date.toJSDate();

  const age = yearsAgo(jsDate);
  const nextBirthday = nextDate(jsDate);
  const starSign = getStarSign(jsDate);

  embed.addFields([
    {
      name: `Info`,
      value:
        `** Age:** ${age} years \n` +
        `** Date:** ${birthday.birthdate.toLocaleDateString("en-GB")} \n`,
      inline: true,
    },
    {
      name: "Timezone",
      value: `${birthday.timezone}`,
      inline: true,
    },
    {
      name: "Countdown",
      value: `<t:${Math.round(Number(nextBirthday) / 1000)}:R>`,
      inline: true,
    },
    {
      name: `Star Sign`,
      value: `${starSign?.name} ${starSign?.icon} `,
      inline: true,
    },
  ]);

  return embed;
}
