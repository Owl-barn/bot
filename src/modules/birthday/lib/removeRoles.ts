import { state } from "@app";
import { Birthday } from "@prisma/client";
import { localState } from "..";

export const removeRoles = async () => {
  const birthdays = await state.db.birthday.findMany({
    where: { hasRole: true },
    include: { guild: { select: { birthdayRoleId: true } } },
  });

  const failures = {
    guild: [] as string[],
    role: [] as string[],
    member: [] as string[],
    permissions: [] as string[],
  };

  const removeFromDb = async (birthday: Birthday) => {
    await state.db.birthday.update({
      where: { userId_guildId: { userId: birthday.userId, guildId: birthday.guildId } },
      data: { hasRole: false },
    }).catch(() => null);
  };

  for (const birthday of birthdays) {
    // Attempt to fetch the guild, if it fails, set hasRole to false and continue.
    if (failures.guild.includes(birthday.guildId)) continue;
    const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
    if (guild === null) {
      await removeFromDb(birthday);
      failures.guild.push(birthday.guildId);
      continue;
    }

    // Attempt to fetch the role, if it fails, set hasRole to false and continue.
    if (birthday.guild.birthdayRoleId === null) continue;
    if (failures.role.includes(birthday.guild.birthdayRoleId)) continue;
    const role = await guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
    if (role === null) {
      await removeFromDb(birthday);
      failures.role.push(birthday.guild.birthdayRoleId ?? "-");
      continue;
    }

    // Attempt to fetch the member, if it fails, set hasRole to false and continue.
    const member = await guild.members.fetch(birthday.userId).catch(() => null);
    if (member === null) {
      await removeFromDb(birthday);
      failures.member.push(birthday.userId);
      continue;
    }

    // Attempt to remove the role.
    const permissions = await member.roles.remove(role).catch(() => null);
    if (permissions === null) failures.permissions.push(birthday.userId);

    // set hasRole to false.
    await removeFromDb(birthday);
  }

  localState.log.info("Completed birthday remove cron job.", { data: failures });
};
