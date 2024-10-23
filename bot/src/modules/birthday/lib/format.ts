import { getStarSign } from "@lib/functions";
import { yearsAgo, nextDate } from "@lib/time";
import { EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";

export function getDateTime(date: Date, timezone: string | null) {
  if (timezone === null) timezone = "UTC";
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(timezone, { keepLocalTime: true });
}

export function formatBirthdayEmbed(embed: EmbedBuilder, birthday: { birthdate: Date, timezone: string }) {
  const date = getDateTime(birthday.birthdate, birthday.timezone);
  const jsDate = date.toJSDate();

  const age = yearsAgo(birthday.birthdate, birthday.timezone);
  const now = DateTime.now().setZone(birthday.timezone);
  const isToday = now.day === date.day && now.month === date.month;
  const birthdayString = isToday ? "🎉" : "";
  const nextBirthday = isToday
    ? date.plus({ days: 1 }).set({ year: now.year }).toJSDate()
    : nextDate(jsDate);
  const starSign = getStarSign(jsDate);

  embed.setDescription(`** Age:** ${birthdayString} ${age} years  ${birthdayString}\n`
    + `** Date:** ${date.toFormat("LLL dd yyyy")} \n`
    + `** Timezone:** ${birthday.timezone} \n`
  );
  embed.addFields([
    {
      name: "Countdown",
      value: `${isToday ? "🎉 ends" : ""} <t:${Math.round(Number(nextBirthday) / 1000)}:R>`,
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
