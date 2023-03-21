import { state } from "@app";
import { Command } from "@structs/command";

export default Command({
  // Command Info
  name: "Terminate",

  // Command Run
  async run(data) {
    const { now } = data;

    if (now) process.exit(1);
    state.controller.softShutdown();

    setTimeout(() => {
      process.exit(1);
    }, 10 * 60 * 1000);

    return {};
  }
});
