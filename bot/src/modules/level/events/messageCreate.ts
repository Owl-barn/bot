import { state } from "@app";
import { Event } from "@structs/event";
import { localState } from "..";
import { calculateLevelFromXP } from "../lib/calculateLevelFromXP";
import { getRandomXP } from "../lib/getRandomXP";
import { levelUp } from "../lib/levelUp";
import { getLevelData } from "../lib/getLevelData";

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
    localState.timeout.set(id, Date.now());

    // Find or create level data for the user.
    const levelData = await getLevelData(msg.guild.id, msg.author.id);

    // Calculate the old and new levels.
    const oldLevel = calculateLevelFromXP(levelData.experience);
    const toAdd = getRandomXP(guildConfig.levelModifier);
    const newExperience = levelData.experience + toAdd;
    const newLevel = calculateLevelFromXP(newExperience);

    // Update the user's experience and level.
    await Promise.all([
      state.db.level.update({
        where: { userId_guildId: { guildId: msg.guild.id, userId: msg.author.id } },
        data: { experience: newExperience },
      }),
      levelUp(msg, guildConfig, newLevel, oldLevel),
    ]);
  },
});
