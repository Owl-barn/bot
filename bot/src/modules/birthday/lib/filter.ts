import { Birthday, Guild, User } from "@prisma/client";

type Input = (Birthday & { user: User; guild: Guild; })

export const filter = (birthday: Input) => {
  const date = birthday.date;
  const today = new Date();

  if (date === null) return false;
  if (birthday.user.isBanned) return false;
  if (birthday.guild.birthdayChannelId === null && birthday.guild.birthdayRoleId === null) return false;

  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
};
