import { Argument, Command } from "../types/Command";

import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import Collection from "@discordjs/collection";
import { argumentType } from "../types/argument";

function argumentHanlder(builder: SlashCommandBuilder, args: Argument[]) {
    args.forEach(arg => {
        switch (arg.type) {
            case argumentType.user:
                builder.addUserOption(option =>
                    option.setName(arg.name)
                        .setDescription(arg.description)
                        .setRequired(arg.required));
                break;
            case argumentType.string:
                builder.addStringOption(option =>
                    option.setName(arg.name)
                        .setDescription(arg.description)
                        .setRequired(arg.required));
        }
    });
}
export default function registerCommand(input: Collection<string, Command>, guild: string): void {
    const commands: SlashCommandBuilder[] = [];
    input.forEach((command) => {

        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description)
            .addBooleanOption(Option =>
                Option.setName("hidden")
                    .setDescription("hide result?")
                    .setRequired(false));

        if (command.args) {
            argumentHanlder(builder, command.args);
        }

        commands.push(builder);
    });

    const commandJson = commands.map(command => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);

    rest.put(Routes.applicationGuildCommands("896781020056145931", guild), { body: commandJson })
        .then(() => console.log("Successfully registered application commands."))
        .catch(console.error);
}