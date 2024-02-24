import { state } from "@app";
import { getQueueInfo } from "@lib/queue/queueInfo";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Play",

  // Command Run
  async run(data) {
    const { guildId, channelId, userId, force, query } = data;

    const guild = await state.client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    if (!channel || !channel.isVoiceBased()) return { error: "That is not a voice channel" };
    if (!channel.joinable) return { error: "I can't join this channel" };

    let queue = state.controller.getQueue(guildId);
    if (!queue || queue.destroyed) {
      queue = state.controller.createQueue(channel);

      queue.on("SongStart", (track, queue) => {
        state.server.broadcast("SongStart", {
          track,
          queue,
          channelId: channelId,
          guildId: guildId,
        });
      });

      queue.on("QueueEnd", () => {
        state.server.broadcast("QueueEnd", {
          channelId: channelId,
          guildId: guildId,
        });
      });

      queue.on("SongEnd", (track, queue) => {
        state.server.broadcast("SongEnd", {
          track,
          queue,
          channelId: channelId,
          guildId: guildId,
        });
      });
    }

    const track = await state.controller.search(query, userId);

    if ("error" in track) return track;

    // Add the track to the queue
    queue.addTrack(track, force);
    // If the force flag is set, skip the current track
    if (force) queue.skip();

    return { track, queueInfo: getQueueInfo(queue) };
  }
});
