import { User } from "@prisma/client";
import { getDateTime } from "./format";
import { yearsAgo } from "@lib/time";

export function getAgeInfo(birthdays: User[]) {

  let combined = 0;
  const currentYear = new Date().getFullYear();

  birthdays = birthdays.filter(x => x.birthdate && x.birthdate.getFullYear() > currentYear - 40);
  birthdays = birthdays.map((x) => {
    x.birthdate = getDateTime(x.birthdate as Date, x.timezone).toJSDate();
    return x;
  });

  birthdays = birthdays.sort((x, y) => Number(y.birthdate) - Number(x.birthdate));

  const yearsAgoHelper = (user: { birthdate: Date | null; timezone: string | null; }) => yearsAgo(user.birthdate as Date, user.timezone);

  birthdays.forEach((x) => (combined += yearsAgoHelper(x)));

  const average = Math.round(combined / birthdays.length);

  return {
    average,
    median: yearsAgoHelper(birthdays[Math.round(birthdays.length / 2)]),
    range: {
      min: yearsAgoHelper(birthdays[0]),
      max: yearsAgoHelper(birthdays[birthdays.length - 1]),
    },
  };
}
