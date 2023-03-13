import { state } from "@app";
import { Event } from "@structs/event";
import { RoleResolvable } from "discord.js";
import { localState } from "..";
import { calculateLevelFromXP } from "../lib/calculateLevelFromXP";
import { getRandomXP } from "../lib/getRandomXP";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg.guildId) return;
    if (msg.author.bot) return;
    const guildConfig = state.guilds.get(msg.guildId);
    if (!guildConfig) return;
    if (!guildConfig.level) return;

    const id = `${msg.guildId}-${msg.author.id}`;
    const lastTimeout = localState.timeout.get(id);

    if (lastTimeout && Date.now() - 60 * 1000 < lastTimeout) return;

    const guild = msg.guildId;
    const user = msg.author.id;

    let query = await state.db.level.findUnique({
      where: {
        userId_guildId: { guildId: guild, userId: user },
      },
    });

    if (!query)
      query = await state.db.level.create({
        data: { userId: user, guildId: guild },
      });

    const current = calculateLevelFromXP(query.experience);

    const toAdd = getRandomXP(guildConfig.levelModifier);
    current.currentXP += toAdd;

    if (current.currentXP >= localState.levelArray[current.level].xp) {
      current.level += 1;

      // Assign level roles.
      const roleRewards = await state.db.levelReward.findMany({
        where: { guildId: guild, level: { lte: current.level } },
      });

      const currentRoles = msg.member?.roles.cache.map((x) => x.id);

      const rolesToAdd = currentRoles
        ? roleRewards.filter(
          (x) => currentRoles?.indexOf(x.roleId) === -1,
        )
        : roleRewards;

      if (rolesToAdd.length > 0) {
        const roles: RoleResolvable[] = [];
        for (const x of rolesToAdd) {
          const role = msg.guild?.roles.resolveId(x.roleId);
          if (!role) continue;
          roles.push(role);
        }
        await msg.member?.roles.add(roles);
      }

      // Notify user.
      let message = guildConfig.levelMessage;
      if (message) {
        message = message.replace("{LEVEL}", String(current.level));
        message = message.replace("{USER}", `<@${user}>`);
        message = message.replace("{NEW_ROLES}", String(rolesToAdd.length));

        if (guildConfig.levelChannelId) {
          const channel = msg.guild?.channels.cache.get(guildConfig.levelChannelId);

          if (!channel || !channel.isTextBased()) {
            await state.db.guild.update({
              where: { id: guild },
              data: { levelChannelId: null },
            });

            await msg.reply(message);

          } else {
            await channel.send(message);
          }
        } else {
          msg.reply(message);
        }
      }
    }

    await state.db.level.update({
      where: { userId_guildId: { guildId: guild, userId: user } },
      data: { experience: current.totalXP + toAdd },
    });

    localState.timeout.set(id, Date.now());
  },

});
