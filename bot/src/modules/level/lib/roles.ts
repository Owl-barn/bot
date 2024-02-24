import { state } from "@app";
import { LevelReward } from "@prisma/client";
import { Message, RoleResolvable } from "discord.js";
import { CalculatedLevel } from "./calculateLevelFromXP";

export async function addRoles(msg: Message<true>, rolesToAdd: LevelReward[]) {
  if (rolesToAdd.length === 0) return;

  // Resolve the roles to add
  const roles = rolesToAdd.reduce((acc, x) => {
    const role = msg.guild.roles.resolveId(x.roleId);
    if (role) acc.push(x.roleId);
    return acc;
  }, [] as RoleResolvable[]);

  // Add the roles to the user
  await msg.member?.roles.add(roles);
}

export async function getRoles(msg: Message<true>, current: CalculatedLevel) {
  // Fetch rewards from db
  const roleRewards = await state.db.levelReward.findMany({
    where: { guildId: msg.guildId, level: { lte: current.level } },
  });

  const currentRoles = msg.member?.roles.cache.map((x) => x.id);

  // Check what roles the user is missing
  const rolesToAdd = currentRoles
    ? roleRewards.filter((x) => currentRoles?.indexOf(x.roleId) === -1)
    : roleRewards;

  return rolesToAdd;
}
