import { Event } from "@structs/event";
import { localState } from "..";
import { state } from "@app";

export default Event({
  name: "voiceStateUpdate",
  once: false,

  async execute(oldState, newState) {
    // If the user is banned, ignore their interactions
    if (state.bannedUsers.get(newState.id) !== undefined) return;

    await localState.controller
      .onChange(oldState, newState)
      .catch(localState.log.error);
  },

});
