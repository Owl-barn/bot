import { state } from "@app";
import { LocalState } from "@structs/localState";
import { Module } from "@structs/module";
import { getAgeInfo } from "./lib/analyse";

export default {
  name: "birthday",
  description: "Birthday system.",

  stats: async (guildId) => {
    let birthdays = await state.db.user.findMany({
      where: {
        birthdate: { not: null },
        OR: [
          { UserGuildConfig: { some: { guildId, birthdayEnabled: true } } },
          { birthdayGlobalEnabled: true },
        ],
      },
    });

    if (guildId) {
      const members = await state.client.guilds.cache.get(guildId)?.members.fetch();
      if (members) {
        const memberIds = members.map(m => m.id);
        birthdays = birthdays.filter(b => memberIds.includes(b.id));
      }
    }

    const ageInfo = getAgeInfo(birthdays);

    let statistics = `**Total:** ${birthdays.length}\n`;
    statistics += `**Range:** ${ageInfo.range.min} - ${ageInfo.range.max}\n`;
    statistics += `**Median:** ${ageInfo.median}`;

    return { name: "Birthdays", value: statistics, inline: false };
  },
} as Module;


const localState = {} as LocalState;

export { localState };
