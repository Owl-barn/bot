import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Terminate",

  // Command Run
  async run(data) {
    const { now } = data;

    if (now) process.exit(1);
    else {
      state.log.controller.info(`Emitting shutdown to ${state.player.queues.cache.size} queues`);
      state.player.queues.cache.forEach(async (queue) => {
        if (queue.isEmpty()) {
          queue.delete();
          return;
        }

        state.server.broadcast(
          "Shutdown",
          queue.guild.id,
          queue.channel?.id
        );
      });
    }

    setTimeout(() => {
      process.exit(1);
    }, 10 * 60 * 1000);

    return {};
  }
});
