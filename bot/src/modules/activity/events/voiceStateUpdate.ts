import { Event } from "@structs/event";
import { state } from "@app";
import { isDebounced } from "../lib/debounce";
import { localState } from "..";
import { connectGuildUserConfig } from "../lib/connect";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {
    const guild = newState.guild;
    const user = newState.member?.user;

    if (!guild || !user || user.bot) return;

    // Check if we did this recently
    const id = `${guild.id}-${user.id}`;
    if (isDebounced(localState.voiceDebounce, id)) return;


    const data = { lastVoiceActivity: new Date() };

    // Update in the database
    await state.db.userGuildConfig.upsert({
      where: { userId_guildId: { userId: user.id, guildId: guild.id } },
      update: data,
      create: {
        ...data,
        ...connectGuildUserConfig(guild.id, user.id),
      }
    });

  },

});
