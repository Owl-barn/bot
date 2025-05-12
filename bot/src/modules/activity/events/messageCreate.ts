import { state } from "@app";
import { Event } from "@structs/event";
import { isDebounced } from "../lib/debounce";
import { localState } from "..";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    const guild = msg.guild;
    const user = msg.author;

    if (!guild || !user || user.bot) return;
    if (msg.channel.isDMBased()) return;

    // Check if we did this recently
    const id = `${msg.guild.id}-${msg.author.id}`;
    if (isDebounced(localState.messageDebounce, id)) return;


    let data = { lastMessageActivity: new Date() };

    // Update in the database
    await state.db.userGuildConfig.upsert({
      where: { userId_guildId: { userId: user.id, guildId: guild.id } },
      update: data,
      create: {
        ...data,
        user: { connect: { id: user.id } },
        guild: { connect: { id: guild.id } },
      }
    });

  },
});
