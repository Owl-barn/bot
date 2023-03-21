import { state } from "@app";
import { AudioPlayerStatus } from "@discordjs/voice";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Pause",

  // Command Run
  async run(data) {
    const { guildId } = data;
    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    const paused = queue.player.state.status != AudioPlayerStatus.Paused;

    queue.pause();

    return { paused };
  }
});

export interface Arguments {
  guildId: string,
}

export interface Response {
  paused: boolean;
}
