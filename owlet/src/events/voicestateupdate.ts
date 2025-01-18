import { state } from "@app";
import { Event } from "@structs/event";
import status from "commands/status";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {

    if (oldState.id === newState.client.user?.id) {
      state.server.broadcast("Status", await status.run({}));
    }
  }
});
