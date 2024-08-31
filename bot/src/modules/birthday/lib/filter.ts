import { Guild, User, UserGuildConfig } from "@prisma/client";
import { DateTime } from "luxon";
import { getDateTime } from "./format";

type Input = (UserGuildConfig & { user: User; guild: Guild; })

export const filter = (birthday: Input) => {

  if (birthday.user.isBanned) return false;
  if (birthday.guild.birthdayChannelId === null && birthday.guild.birthdayRoleId === null) return false;

  if (birthday.user.birthdate === null) return false;
  const zone = birthday.user.timezone ?? "UTC";

  const now = DateTime.now().setZone(zone).startOf("minute");
  const date = getDateTime(birthday.user.birthdate, zone).set({ year: now.year });
  const difference = date.diff(now, "minutes").minutes;

  return Math.abs(difference) == 0;
};
