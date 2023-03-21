import { state } from "@app";
import { Command } from "@structs/command";
import { QueueInfo, getQueueInfo } from "../lib/queue/queueInfo";
import { Track, CurrentTrack } from "../lib/track";

export default Command({
  // Command Info
  name: "Queue",

  // Command Run
  async run(data) {
    const { guildId } = data;

    const guild = await state.client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = state.controller.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    let queueList = queue.getTracks();
    const nowPlaying = queue.nowPlaying();

    return {
      queueInfo: getQueueInfo(queue),
      queue: queueList,
      current: nowPlaying,
    };
  }
});

export interface Arguments {
  guildId: string,
};

export interface Response {
  queue: Track[];
  current: CurrentTrack | null;
  queueInfo: QueueInfo;
}
