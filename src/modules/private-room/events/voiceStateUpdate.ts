import { Event } from "@structs/event";
import { localState } from "..";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {
    await localState.controller
      .onChange(oldState, newState)
      .catch(console.error);
  },

});
