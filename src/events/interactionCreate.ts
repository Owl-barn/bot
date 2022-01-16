import { HexColorString, MessageEmbed } from "discord.js";
import logService from "../lib/logger.service";
import throttleService from "../lib/throttle.service";
import { returnMessage } from "../types/Command";
import RavenEvent from "../types/event";
import RavenInteraction, { RavenButtonInteraction } from "../types/interaction";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "interactionCreate";
    once = false;
    throttle = throttleService;
    errorEmbed = new MessageEmbed()
        .setDescription(`An error occurred, please make a report of this in [the Raven bot discord server](${process.env.SUPPORT_SERVER})`)
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    async execute(interaction: RavenInteraction): Promise<void> {
        if (interaction.isButton()) {
            return await this.buttonEvent(interaction as RavenButtonInteraction).catch(e => console.error(e));
        }
        if (interaction.isCommand()) {
            return await this.commandEvent(interaction).catch(e => console.error(e));
        }
    }

    async commandEvent(msg: RavenInteraction): Promise<void> {
        const client = msg.client as RavenClient;

        const { commandName } = msg;

        const command = client.commands.get(commandName);

        if (!command) return;

        if (command.adminOnly && msg.user.id !== process.env.OWNER_ID) return;

        const isThrottled = this.throttle.isThrottled(msg.guildId || "e", msg.user.id, command);

        if (isThrottled) {
            await msg.reply({ ephemeral: true, content: `Throttled, try again in \`${isThrottled}\` seconds` }).catch(e => console.error(e));
            return;
        }

        this.respond(msg, command?.execute);
    }

    async buttonEvent(msg: RavenButtonInteraction): Promise<void> {
        const client = msg.client;

        const commandName = msg.customId.split("_")[0];

        const command = client.buttons.get(commandName);

        if (!command) return;

        const response = await command.execute(msg)
            .catch((e: Error) => {
                console.log(e);
                return { ephemeral: true, embeds: [this.errorEmbed] } as returnMessage;
            });

        if (!response || response.content?.length === 0) return;
        await msg.reply(response).catch(e => console.error(e));
    }

    async respond(interaction: RavenInteraction, func: (message: RavenInteraction) => Promise<returnMessage | void>): Promise<void> {

        const hidden = interaction.options.get("hidden") === null ? false : interaction.options.get("hidden")?.value as boolean;

        logService.logCommand(interaction, hidden);

        this.throttle.addToThrottle(interaction.guildId || "e", interaction.user.id, interaction.commandName);

        const response = await func(interaction)
            .then((x) => {
                if (!x) return null;
                x.ephemeral = hidden;
                return x;
            })
            .catch((e: Error) => {
                console.log(e);
                return { ephemeral: true, embeds: [this.errorEmbed] } as returnMessage;
            });

        if (!response) return;
        if (interaction.replied) await interaction.followUp(response).catch(e => console.error(e));
        else if (interaction.deferred) await interaction.editReply(response).catch(e => console.error(e));
        else await interaction.reply(response).catch(e => console.error(e));

        if (response.callback) this.respond(interaction, response.callback).catch(e => console.error(e));
    }
}