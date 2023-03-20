import { state } from "@app";
import { Event } from "@structs/event";
import { buttonEvent } from "../lib/buttonEvent";
import { commandEvent } from "../lib/commandEvent";

export default Event({
  name: "interactionCreate",
  once: false,

  async execute(interaction) {
    const guildconfig = interaction.guild && state.guilds.get(interaction.guild.id);
    if (guildconfig?.isBanned) return;

    if (interaction.isButton()) {
      await buttonEvent(interaction)
        .catch(console.error);
      return;
    }
    if (interaction.isChatInputCommand()) {
      await commandEvent(interaction)
        .catch(console.error);
      return;
    }
  },
});
