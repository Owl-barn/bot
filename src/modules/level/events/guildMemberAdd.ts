import { state } from "@app";
import { Event } from "@structs/event";
import { RoleResolvable } from "discord.js";
import { localState } from "..";
import { calculateLevelFromXP } from "../lib/calculateLevelFromXP";

export default Event({
  name: "guildMemberAdd",
  once: false,

  async execute(member) {
    const config = localState.guilds.get(member.guild.id);

    if (!config?.level) return;

    const userLevel = await state.db.level.findUnique({
      where: {
        user_id_guild_id: {
          user_id: member.id,
          guild_id: member.guild.id,
        },
      },
    });

    if (!userLevel) return;

    const level = calculateLevelFromXP(userLevel.experience);
    const rewards = await state.db.level_reward.findMany({
      where: { level: { lte: level.level }, guild_id: member.guild.id },
    });

    if (rewards.length === 0) return;

    const roles: RoleResolvable[] = [];
    for (const x of rewards) {
      const role = member.guild.roles.resolveId(x.role_id);
      if (!role) continue;
      roles.push(role);
    }

    await member.roles
      .add(roles, "Level roles")
      .catch(() => console.log("Couldnt assign roles"));
  },

});
