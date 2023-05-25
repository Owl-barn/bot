import { state } from "@app";
import { Command } from "@structs/command";
import { Track } from "../lib/track";
import { Queue } from "@lib/queue";

export default Command({
  // Command Info
  name: "Skip",


  // Command Run
  async run(data) {
    const { guildId, index, trackId, userId, canForce } = data;
    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) return { error: "No music is playing right now." };

    let track: Track | null;
    let isNowPlaying = false;

    // Find track
    if (trackId) {
      track = queue.getTrack(trackId);

      if (!track && queue.nowPlaying()?.id === trackId) {
        track = queue.nowPlaying();
        isNowPlaying = true;
      }

    }
    else if (index) track = queue.getTrack(index - 1);
    else {
      track = queue.nowPlaying();
      if (track) isNowPlaying = true;
    }

    if (!track) return { error: "I couldn't find that song." };

    // Check if user can skip
    if (track.requestedBy !== userId && !data.canForce) return { error: "You can't skip a song you didn't request." };

    // Skip
    if (isNowPlaying) queue.skip();
    else queue.removeTrack(track);


    return { track };
  }
});
