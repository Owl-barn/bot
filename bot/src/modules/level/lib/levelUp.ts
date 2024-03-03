import { Message } from "discord.js";
import { CalculatedLevel } from "./calculateLevelFromXP";
import { notify } from "./notify";
import { getRoles, addRoles } from "./roles";
import { Guild } from "@prisma/client";

export async function levelUp(msg: Message<true>, guildConfig: Guild, newLevel: CalculatedLevel, oldLevel: CalculatedLevel | undefined = undefined) {
  if (oldLevel && newLevel.level <= oldLevel.level) return;

  const roles = await getRoles(msg, newLevel);
  await Promise.all([
    addRoles(msg, roles),
    notify(msg, guildConfig, newLevel, roles),
  ]);
}
