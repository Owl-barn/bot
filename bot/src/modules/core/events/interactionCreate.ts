import { state } from "@app";
import { Event } from "@structs/event";
import { buttonEvent } from "../lib/buttonEvent";
import { commandEvent } from "../lib/commandEvent";
import { SelectEvent } from "../lib/selectEvent";
import { AutocompleteEvent } from "../lib/autocompleteEvent";

export default Event({
  name: "interactionCreate",
  once: false,

  async execute(interaction) {
    let command: { run: Promise<unknown>, id: string } | undefined;

    // If the user is banned, ignore their interactions
    if (state.bannedUsers.get(interaction.user.id) !== undefined) return;

    if (interaction.isButton()) {
      command = {
        run: buttonEvent(interaction),
        id: interaction.customId,
      };

    } else if (interaction.isAnySelectMenu()) {
      command = {
        run: SelectEvent(interaction),
        id: interaction.customId,
      };

    } else if (interaction.isChatInputCommand()) {
      command = {
        run: commandEvent(interaction),
        id: interaction.commandName,
      };
    } else if (interaction.isAutocomplete()) {
      command = {
        run: AutocompleteEvent(interaction),
        id: interaction.commandName,
      };
    }

    if (!command) return;
    await command.run.catch(error => {
      state.log.error(`Error executing command event ${command?.id.cyan}`, { error });
    });
  },

});
