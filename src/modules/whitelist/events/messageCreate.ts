import { state } from "@app";
import { Event } from "@structs/event";
import { massWhitelist } from "../lib/mc.service";

export default Event({
  name: "messageCreate",
  once: false,

  async execute(msg) {
    if (!msg.guild) return;
    if (msg.member?.id !== state.env.OWNER_ID) return;
    if (msg.content !== "masswhitelist*") return;

    await massWhitelist(msg.guild, state.db);
    msg.reply("Mass whitelisted!");
    return;

  },
});
