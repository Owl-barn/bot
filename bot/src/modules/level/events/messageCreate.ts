import { Event } from "@structs/event";
import { localState } from "..";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg.inGuild()) return;
    if (msg.author.bot) return;
    if (!msg.member) return;

    await localState.controller.handleXPEvent(msg.member, msg);
  },
});
