import { state } from "@app";
import { getQueueInfo } from "@lib/queue/queueInfo";
import { Command } from "@structs/command";
import { Track } from "../lib/track";

export default Command({
  // Command Info
  name: "Play",

  // Command Run
  async run(data) {
    const { guildId, channelId, userId, force, query } = data;

    const guild = await state.client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    if (!channel || !channel.isVoiceBased()) throw "That is not a voice channel";
    if (!channel.joinable) throw "I can't join this channel";

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

    let track = await state.controller.search(query, userId);

    if (!track) throw "Could not find a track with that name";

    // Add the track to the queue
    queue.addTrack(track, force);
    // If the force flag is set, skip the current track
    if (force) queue.skip();

    return { track, queueInfo: getQueueInfo(queue) };
  }
});


export interface Arguments {
  guildId: string,
  channelId: string,
  userId: string,
  force: boolean,
  query: string,
};

export interface Response {
  track: Track;
  queueInfo: QueueInfo
}

interface QueueInfo {
  length: number;
  size: number;
}
