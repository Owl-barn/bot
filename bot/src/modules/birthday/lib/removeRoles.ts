import { state } from "@app";
import { localState } from "..";
import { DateTime } from "luxon";
import { getDateTime } from "./format";
import { Guild, User, UserGuildConfig } from "@prisma/client";

export const removeRoles = async () => {
  let birthdays = await state.db.userGuildConfig.findMany({
    where: { birthdayHasRole: true },
    include: {
      user: true,
      guild: true,
    },
  });


  // Filter out birthdays that are not yet over
  birthdays = birthdays.filter((birthday) => {
    if (birthday.user.birthdate === null) return false;
    const zone = birthday.user.timezone ?? "UTC";
    const now = DateTime.now().setZone(zone).startOf("minute");
    const date = getDateTime(birthday.user.birthdate, zone).set({ year: now.year }).plus({ days: 1 });
    return now > date;
  });

  let removed = 0;

  const failures = {
    guild: [] as string[],
    role: [] as string[],
    member: [] as string[],
    permissions: [] as string[],
  };

  for (const birthday of birthdays) {
    if (failures.guild.includes(birthday.guildId)) continue;
    if (!birthday.guild.birthdayRoleId || failures.role.includes(birthday.guild.birthdayRoleId)) continue;
    if (failures.member.includes(birthday.userId)) continue;
    if (failures.permissions.includes(birthday.guild.birthdayRoleId)) continue;

    removeBirthdayRole(birthday)
      .catch((error) => {
        switch (error) {
          case "Failed to fetch guild.":
            failures.guild.push(birthday.guildId);
            break;
          case "Failed to fetch role.":
            failures.role.push(birthday.guild.birthdayRoleId as string);
            break;
          case "Failed to fetch member.":
            failures.member.push(birthday.userId);
            break;
          case "Failed to remove role.":
            failures.permissions.push(birthday.guild.birthdayRoleId as string);
            break;
          default:
            localState.log.error("Failed to remove birthday role.", { data: error });
        }
      });

    removed++;
  }

  if (removed > 0) localState.log.info(`Removed ${removed} birthday roles.`, { data: failures });
};


export async function removeBirthdayRole(birthday: UserGuildConfig & { guild: Guild, user: User }) {
  // Toggle hasRole to false.
  await state.db.userGuildConfig.update({
    where: { userId_guildId: { userId: birthday.userId, guildId: birthday.guildId } },
    data: { birthdayHasRole: false },
  }).catch(() => null);

  // Attempt to fetch the guild, if it fails, set hasRole to false and continue.
  const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
  if (guild === null) {
    throw "Failed to fetch guild.";
  }

  // Attempt to fetch the role, if it fails, set hasRole to false and continue.
  if (birthday.guild.birthdayRoleId === null) return;
  const role = await guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
  if (role === null) {
    throw "Failed to fetch role.";
  }

  // Attempt to fetch the member, if it fails, set hasRole to false and continue.
  const member = await guild.members.fetch(birthday.userId).catch(() => null);
  if (member === null) {
    throw "Failed to fetch member.";
  }

  // Attempt to remove the role.
  const deletedRole = await member.roles.remove(role).catch(() => null);
  if (deletedRole === null)
    throw "Failed to remove role.";
}
