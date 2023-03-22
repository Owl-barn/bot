import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Loop",

  // Command Run
  async run(data) {
    const { guildId, loop } = data;

    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) return { error: "No music is playing" }

    queue.setLoopMode(loop);

    return { loop };
  }
});
