import { state } from "@app";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { Event } from "@structs/event";
import { localState } from "..";
import { calculateLevelFromXP } from "../lib/calculateLevelFromXP";
import { getRandomXP } from "../lib/getRandomXP";
import { notify } from "../lib/notify";
import { addRoles, getRoles } from "../lib/roles";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg.inGuild()) return;

    if (msg.author.bot) return;

    const guildConfig = state.guilds.get(msg.guildId);
    if (!guildConfig) return;
    if (!guildConfig?.level) return;

    // If the user has already gained XP in the last minute, return.
    const id = `${msg.guildId}-${msg.author.id}`;
    const lastTimeout = localState.timeout.get(id);
    if (lastTimeout && Date.now() - 60 * 1000 < lastTimeout) return;


    // Find or create level data for the user.
    let level = await state.db.level.findUnique({
      where: {
        userId_guildId: { guildId: msg.guild.id, userId: msg.author.id },
      },
    });

    if (!level)
      level = await state.db.level.create({
        data: {
          user: connectOrCreate(msg.author.id),
          guild: connectOrCreate(msg.guild.id),
        },
      });

    // Calculate the current level and add XP.
    const current = calculateLevelFromXP(level.experience);
    const toAdd = getRandomXP(guildConfig.levelModifier);
    current.currentXP += toAdd;

    // If the user has leveled up, add the roles and notify the user.
    if (current.currentXP >= current.levelXP) {
      current.level += 1;

      const roles = await getRoles(msg, current);
      await addRoles(msg, roles);
      await notify(msg, guildConfig, current, roles);
    }

    await state.db.level.update({
      where: { userId_guildId: { guildId: msg.guild.id, userId: msg.author.id } },
      data: { experience: current.totalXP + toAdd },
    });

    localState.timeout.set(id, Date.now());
  },

});
