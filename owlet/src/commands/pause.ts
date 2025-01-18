import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Pause",

  // Command Run
  async run(data) {
    const { guildId } = data;
    const queue = state.player.nodes.get(guildId);

    if (!queue || queue.currentTrack === null) return { error: "No music is playing" };

    const wasPaused = queue.node.isPaused();

    wasPaused ? queue.node.resume() : queue.node.pause();

    return { paused: !wasPaused };
  }
});
