import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Bump",

  // Command Run
  async run(data) {
    const { guildId, query, userId } = data;
    const guild = await state.client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = state.player.queues.get(guild.id);

    if (!queue || queue.isEmpty()) return { error: "No music is playing" };

    const track = queue.tracks.find((track) => track.id === query);

    if (!track) return { error: "I couldn't find that song" };

    queue.moveTrack(track, 0);
    queue.node.skip();

    return { track };
  }
});
