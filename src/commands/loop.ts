import { state } from "@app";
import { loopMode } from "@lib/queue/loop";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Loop",

  // Command Run
  async run(data) {
    const { guildId, loop } = data;

    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    queue.setRepeatMode(loop);

    return { loop };
  }
});

export interface Arguments {
  guildId: string,
  loop: loopMode,
}

export interface Response {
  loop: loopMode;
}

