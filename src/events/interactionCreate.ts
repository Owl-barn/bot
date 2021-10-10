import { BaseCommandInteraction } from "discord.js";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "interactionCreate";
    once = false;

    execute(interaction: BaseCommandInteraction): void {
        if (!interaction.isCommand()) return;

        const client = interaction.client as RavenClient;

        const { commandName } = interaction;

        const command = client.commands.get(commandName);

        command?.execute(interaction).catch(() => interaction.reply({ ephemeral: true, content: "An error occured." }));
    }
}