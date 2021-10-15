import { CommandInteraction, InteractionReplyOptions } from "discord.js";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "interactionCreate";
    once = false;

    async execute(interaction: CommandInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const client = interaction.client as RavenClient;

        const { commandName } = interaction;

        const command = client.commands.get(commandName);

        const hidden = interaction.options.get("hidden") === null ? false : interaction.options.get("hidden")?.value as boolean;

        await command?.execute(interaction)
            .then((message: InteractionReplyOptions) => {
                message.ephemeral = hidden;
                interaction.reply(message);
            })
            .catch((e: Error) => {
                console.log(e);
                interaction.reply({ ephemeral: true, content: "An error occured." });
            });
    }
}