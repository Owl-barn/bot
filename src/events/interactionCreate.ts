import logService from "../lib/logger.service";
import { returnMessage } from "../types/Command";
import RavenEvent from "../types/event";
import RavenInteraction from "../types/interaction";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "interactionCreate";
    once = false;

    async execute(interaction: RavenInteraction): Promise<void> {
        if (!interaction.isCommand()) return;

        const client = interaction.client as RavenClient;

        const { commandName } = interaction;

        const command = client.commands.get(commandName);

        if (!command) return;

        if (command.adminOnly && interaction.user.id !== process.env.OWNER_ID) return;

        this.respond(interaction, command?.execute);
    }

    async respond(interaction: RavenInteraction, func: (message: RavenInteraction) => Promise<returnMessage | void>): Promise<void> {

        const hidden = interaction.options.get("hidden") === null ? false : interaction.options.get("hidden")?.value as boolean;

        logService.logCommand(interaction, hidden);

        const response = await func(interaction)
            .then((x) => {
                if (!x) return null;
                x.ephemeral = hidden;
                return x;
            })
            .catch((e: Error) => {
                console.log(e);
                return { ephemeral: true, content: "An error occured." } as returnMessage;
            });

        if (!response) return;
        if (interaction.replied) interaction.followUp(response).catch(e => console.error(e));
        else if (interaction.deferred) interaction.editReply(response).catch(e => console.error(e));
        else interaction.reply(response).catch(e => console.error(e));

        if (response.callback) this.respond(interaction, response.callback).catch(e => console.error(e));
    }
}