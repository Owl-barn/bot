import { Birthday, Guild, User } from "@prisma/client";
import { DateTime } from "luxon";
import { getDateTime } from "./format";

type Input = (Birthday & { user: User; guild: Guild; })

export const filter = (birthday: Input) => {

  if (birthday.user.isBanned) return false;
  if (birthday.guild.birthdayChannelId === null && birthday.guild.birthdayRoleId === null) return false;

  const now = DateTime.now().setZone(birthday.timezone);
  const date = getDateTime(birthday.date, birthday.timezone).set({ year: now.year });
  const difference = date.diff(now, "minutes").minutes;

  return Math.abs(difference) < 5;
};
