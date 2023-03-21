import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Stop",

  // Command Run
  async run(data) {
    const { guildId } = data;

    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) return { error: "No music is playing" }

    queue.stop();

    return {};
  }
});

export interface Arguments {
  guildId: string,
};

export interface Response {
}
