import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Stop",

  // Command Run
  async run(data) {
    const { guildId } = data;

    const guild = await state.client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = state.player.queues.get(guild.id);

    if (!queue) return { error: "No music is playing" };

    queue.delete();

    return {};
  }
});
