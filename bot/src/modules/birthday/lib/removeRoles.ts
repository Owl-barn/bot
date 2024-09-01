import { state } from "@app";
import { localState } from "..";
import { Guild, User, UserGuildConfig } from "@prisma/client";
import { ExpandedBirthday } from "../structs/expandedBirthday";

export const removeBirthdayRoles = async (birthdays: ExpandedBirthday[]) => {
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
          case RemoveBirthdayRoleError.GUILD_NOT_FOUND:
            failures.guild.push(birthday.guildId);
            break;
          case RemoveBirthdayRoleError.ROLE_NOT_FOUND:
            failures.role.push(birthday.guild.birthdayRoleId as string);
            break;
          case RemoveBirthdayRoleError.MEMBER_NOT_FOUND:
            failures.member.push(birthday.userId);
            break;
          case RemoveBirthdayRoleError.ROLE_NOT_REMOVED:
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

enum RemoveBirthdayRoleError {
  GUILD_NOT_FOUND = "Failed to fetch guild.",
  ROLE_NOT_FOUND = "Failed to fetch role.",
  MEMBER_NOT_FOUND = "Failed to fetch member.",
  ROLE_NOT_REMOVED = "Failed to remove role.",
}


export async function removeBirthdayRole(birthday: UserGuildConfig & { guild: Guild, user: User }) {
  // Toggle hasRole to false.
  await state.db.userGuildConfig.update({
    where: { userId_guildId: { userId: birthday.userId, guildId: birthday.guildId } },
    data: { birthdayHasRole: false },
  }).catch(() => null);

  // Attempt to fetch the guild, if it fails, set hasRole to false and continue.
  const guild = await state.client.guilds.fetch(birthday.guildId).catch(() => null);
  if (guild === null) {
    throw RemoveBirthdayRoleError.GUILD_NOT_FOUND;
  }

  // Attempt to fetch the role, if it fails, set hasRole to false and continue.
  if (birthday.guild.birthdayRoleId === null) return;
  const role = await guild.roles.fetch(birthday.guild.birthdayRoleId).catch(() => null);
  if (role === null) {
    throw RemoveBirthdayRoleError.ROLE_NOT_FOUND;
  }

  // Attempt to fetch the member, if it fails, set hasRole to false and continue.
  const member = await guild.members.fetch(birthday.userId).catch(() => null);
  if (member === null) {
    throw RemoveBirthdayRoleError.MEMBER_NOT_FOUND;
  }

  // Attempt to remove the role.
  const deletedRole = await member.roles.remove(role).catch(() => null);
  if (deletedRole === null)
    throw RemoveBirthdayRoleError.ROLE_NOT_REMOVED;
}
