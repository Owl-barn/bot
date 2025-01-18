import { state } from "@app";
import { Command } from "@structs/command";
import { Track } from "discord-player";

export default Command({
  // Command Info
  name: "Skip",


  // Command Run
  async run(data) {
    const { guildId, index, trackId, userId, canForce } = data;
    const guild = await state.client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = state.player.queues.get(guild.id);

    if (!queue || queue.isEmpty()) return { error: "No music is playing" };

    let track: Track<unknown> | undefined | null;
    let isNowPlaying = false;

    // Find track
    if (trackId) {
      track = queue.tracks.find((t) => t.id === trackId)

      if (!track && queue.currentTrack?.id === trackId) {
        track = queue.currentTrack;
        isNowPlaying = true;
      }

    }
    else if (index) track = queue.tracks.at(index - 1);
    else {
      track = queue.currentTrack;
      if (track) isNowPlaying = true;
    }

    if (!track) return { error: "I couldn't find that song." };

    // Check if user can skip
    if (track.requestedBy?.id !== userId && !canForce) return { error: "You can't skip a song you didn't request." };

    // Skip
    if (isNowPlaying) queue.node.skip();
    else queue.removeTrack(track);


    return { track };
  }
});
