import { state } from "@app";
import { playerLoopModeFromBot } from "@lib/queue/loop";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Loop",

  // Command Run
  async run(data) {
    const { guildId, loop } = data;

    const queue = state.player.nodes.get(guildId);

    if (!queue) return { error: "No music is playing" };

    queue.setRepeatMode(playerLoopModeFromBot(loop));

    return { loop };
  }
});
