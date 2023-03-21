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

    if (!queue || queue.destroyed) throw "No music is playing right now.";

    let removed: Track | null;
    if (index == 0) removed = queue.skip();
    else removed = queue.removeTrack(index - 1);

    if (!removed) throw "I couldn't find that song.";

    return { track: removed };
  }
});

export interface Arguments {
  guildId: string,
  index: number,
};

export interface Response {
  track: Track;
}
