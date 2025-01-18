import { state } from "@app";
import { Command } from "@structs/command";
import { getQueueInfo } from "../lib/queue/queueInfo";
import { BotCurrentTrack, BotTrack } from "@lib/queue/track";

export default Command({
  // Command Info
  name: "Queue",

  // Command Run
  async run(data) {
    const { guildId } = data;

    const guild = await state.client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = state.player.queues.get(guild.id);

    if (!queue || !queue.isPlaying()) return { error: "No music is playing" };

    return {
      queueInfo: getQueueInfo(queue),
      queue: queue.tracks.map((track) => new BotTrack(track)),
      current: new BotCurrentTrack(queue.currentTrack!, queue.node),
    };
  }
});
