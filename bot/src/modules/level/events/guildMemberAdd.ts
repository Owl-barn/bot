import { state } from "@app";
import { Event } from "@structs/event";
import { RoleResolvable } from "discord.js";
import { localState } from "..";

export default Event({
  name: "guildMemberAdd",
  once: false,

  async execute(member) {
    const config = state.guilds.get(member.guild.id);

    if (!config?.level) return;

    const userLevel = await state.db.level.findUnique({
      where: {
        userId_guildId: {
          userId: member.id,
          guildId: member.guild.id,
        },
      },
    });

    if (!userLevel) return;

    const level = localState.controller.getLevelFromXP(userLevel.experience);
    const rewards = await state.db.levelReward.findMany({
      where: { level: { lte: level.level }, guildId: member.guild.id },
    });

    if (rewards.length === 0) return;

    const roles: RoleResolvable[] = [];
    for (const x of rewards) {
      const role = member.guild.roles.resolveId(x.roleId);
      if (!role) continue;
      roles.push(role);
    }

    await member.roles
      .add(roles, "Level roles")
      .catch((error) => {
        localState.log.warn(`Failed to add level roles to <@${member.user.tag.green}>`, { error });
      });
  },

});
