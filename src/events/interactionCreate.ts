import { HexColorString, EmbedBuilder } from "discord.js";
import bannedUsers from "../lib/banlist.service";
import GuildConfig from "../lib/guildconfig.service";
import logService from "../lib/logger.service";
import throttleService from "../lib/throttle.service";
import { returnMessage } from "../types/Command";
import { CommandGroup } from "../types/commandGroup";
import RavenEvent from "../types/event";
import RavenInteraction, { RavenButtonInteraction } from "../types/interaction";
import RavenClient from "../types/ravenClient";

export default class InteractionCreate implements RavenEvent {
    name = "interactionCreate";
    once = false;
    throttle = throttleService;
    errorEmbed = new EmbedBuilder()
        .setDescription(
            `An error occurred, please make a report of this in [the Raven bot discord server](${process.env.SUPPORT_SERVER})`,
        )
        .setColor(process.env.EMBED_FAIL_COLOR as HexColorString);

    async execute(interaction: RavenInteraction): Promise<void> {
        const guildconfig = GuildConfig.getGuild(interaction.guildId || "");
        if (bannedUsers.isBanned(interaction.user.id)) return;
        if (guildconfig?.banned) {
            await interaction
                .reply({
                    content:
                        "This guild is banned from using Raven bot, If you believe this is an issue please contact the bot owner",
                    ephemeral: true,
                })
                .catch((e) => console.error(e));
            return;
        }
        if (interaction.isButton()) {
            return await this.buttonEvent(
                interaction as RavenButtonInteraction,
            ).catch((e) => console.error(e));
        }
        if (interaction.isCommand()) {
            return await this.commandEvent(interaction).catch((e) =>
                console.error(e),
            );
        }
    }

    async quickReply(msg: RavenInteraction, content: string): Promise<void> {
        await msg
            .reply({ ephemeral: true, content })
            .catch((e) => console.error(e));
    }

    async commandEvent(msg: RavenInteraction): Promise<void> {
        const client = msg.client as RavenClient;

        const { commandName } = msg;
        if (!msg.guildId) return;

        const command = client.commands.get(commandName);

        if (!command) return;

        // Chek if owner command.
        if (
            command.group === CommandGroup.owner &&
            msg.user.id !== process.env.OWNER_ID
        )
            return await this.quickReply(
                msg,
                "You are not allowed to do this command.",
            );

        // Check if premium command.
        if (
            command.premium &&
            (!msg.guildId || !GuildConfig.getGuild(msg.guildId)?.premium)
        )
            return await this.quickReply(msg, "This command is premium only.");

        // Check if the user is throttled.
        const isThrottled = this.throttle.isThrottled(
            msg.guildId || "e",
            msg.user.id,
            command,
        );

        if (isThrottled)
            return await this.quickReply(
                msg,
                `Throttled, try again in \`${isThrottled}\` seconds`,
            );

        // Check if the bot has the needed permissions.
        if (command.botPermissions) {
            const missingPerms = command.botPermissions.filter(
                (x) => !msg.guild?.members.me?.permissions.has(x),
            );

            if (missingPerms.length > 0)
                return await this.quickReply(
                    msg,
                    `Missing permissions: \`${missingPerms.join("`, `")}\``,
                );
        }

        this.respond(msg, command?.execute);
    }

    async buttonEvent(msg: RavenButtonInteraction): Promise<void> {
        const client = msg.client;

        const commandName = msg.customId.split("_")[0];

        const command = client.buttons.get(commandName);

        if (!command) return;

        const response = await command.execute(msg).catch((e: Error) => {
            console.log(e);
            return {
                ephemeral: true,
                embeds: [this.errorEmbed],
            } as returnMessage;
        });

        if (!response || response.content?.length === 0) return;
        await msg.reply(response).catch((e) => console.error(e));
    }

    async respond(
        interaction: RavenInteraction,
        func: (message: RavenInteraction) => Promise<returnMessage | void>,
    ): Promise<void> {
        const hidden =
            interaction.options.get("hidden") === null
                ? false
                : (interaction.options.get("hidden")?.value as boolean);

        logService.logCommand(interaction, hidden);

        this.throttle.addToThrottle(
            interaction.guildId || "e",
            interaction.user.id,
            interaction.commandName,
        );

        const response = await func(interaction)
            .then((x) => {
                if (!x) return null;
                x.ephemeral = hidden;
                return x;
            })
            .catch((e: Error) => {
                console.log(e);
                return {
                    ephemeral: true,
                    embeds: [this.errorEmbed],
                } as returnMessage;
            });

        if (!response) return;
        if (interaction.replied)
            await interaction.followUp(response).catch((e) => console.error(e));
        else if (interaction.deferred)
            await interaction
                .editReply(response)
                .catch((e) => console.error(e));
        else await interaction.reply(response).catch((e) => console.error(e));

        if (response.callback)
            this.respond(interaction, response.callback).catch((e) =>
                console.error(e),
            );
    }
}
