import { state } from "@app";
import { Event } from "@structs/event";
import { buttonEvent } from "../lib/buttonEvent";
import { commandEvent } from "../lib/commandEvent";

export default Event({
  name: "interactionCreate",
  once: false,

  async execute(interaction) {

    if (interaction.isButton()) {
      await buttonEvent(interaction)
        .catch(error => {
          state.log.error(`Error executing button event ${interaction.customId.cyan}`, { error });
        });
      return;

    } else if (interaction.isChatInputCommand()) {
      await commandEvent(interaction)
        .catch(error => {
          state.log.error(`Error executing command event ${interaction.commandName.cyan}`, { error });
        });
      return;
    }
  },
});
