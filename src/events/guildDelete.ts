import { state } from "@app";
import { Event } from "@structs/event";
import status from "commands/status";

export default Event({
  name: "guildDelete",
  once: false,

  async execute() {
    state.server.broadcast("Status", await status.run({}));
  }
});
