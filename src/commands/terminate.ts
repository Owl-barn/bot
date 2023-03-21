import { state } from "@app";
import { Command } from "@structs/command";


export default Command({
  // Command Info
  name: "Terminate",

  // Command Run
  async run(data) {
    const { now } = data;

    if (now) process.exit();
    else if (state.controller.getQueues().size === 0) process.exit();
    state.controller.softShutdown();

    setTimeout(() => {
      process.exit();
    }, 10 * 60 * 1000);

    return {};
  }
});

export interface Arguments {
  now: boolean,
};

export interface Response { }
