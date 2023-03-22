import { state } from "@app";
import { Command } from "@structs/command";
import { Track } from "../lib/track";

export default Command({
  // Command Info
  name: "Skip",


  // Command Run
  async run(data) {
    const { guildId, index } = data;
    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) return { error: "No music is playing right now." };

    let track: Track | null;
    if (index == 0) track = queue.skip();
    else track = queue.removeTrack(index - 1);

    if (!track) return { error: "I couldn't find that song." };

    return { track };
  }
});
