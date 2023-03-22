import { state } from "@app";
import { Event } from "@structs/event";
import { localState } from "..";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg.guild) return;
    if (msg.member?.id !== state.env.OWNER_ID) return;
    if (msg.content !== "chaos*") return;

    localState.controller.broadcast({
      command: "Play",
      mid: msg.id,
      data: {
        query: "Funkytown",
        guildId: msg.guild?.id,
        channelId: msg.member?.voice.channelId,
        userId: msg.member?.id,
        force: true,
      },
    });

    return;

  },
});
