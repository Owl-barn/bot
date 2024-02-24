import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Bump",

  // Command Run
  async run(data) {
    const { guildId, query, userId } = data;

    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) return { error: "No music is playing" }

    const track = queue.getTrack(query);

    if (!track) return { error: "I couldn't find that song" };

    queue.bump(track);

    return { track };
  }
});
