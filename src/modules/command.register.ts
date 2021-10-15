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
                break;
            case argumentType.integer:
                builder.addNumberOption(option =>
                    option.setName(arg.name)
                        .setDescription(arg.description)
                        .setRequired(arg.required));
                break;
        }
    });

    return builder;
}
export default function registerCommand(input: Collection<string, Command>, self: string): void {
    const commands: SlashCommandBuilder[] = [];
    const ownerCommands: SlashCommandBuilder[] = [];
    input.forEach((command) => {

        console.log(command.name);

        let builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);


        if (command.args) {
            builder = argumentHanlder(builder, command.args);
        }

        builder.addBooleanOption(Option =>
            Option.setName("hidden")
                .setDescription("hide result?")
                .setRequired(false));

        if (command.adminOnly) {
            ownerCommands.push(builder);
        } else {
            commands.push(builder);
        }
    });

    const commandJson = commands.map(command => command.toJSON());
    const ownerCommandJson = commands.map(command => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);

    Promise.all([
        // rest.put(Routes.applicationCommands(self), { body: commandJson }),
        rest.put(Routes.applicationGuildCommands(self, process.env.DEVSERVERID as string), { body: commandJson }),
        rest.put(Routes.applicationGuildCommands(self, process.env.DEVSERVERID as string), { body: ownerCommandJson }),
    ])
        .then(() => console.log("Successfully registered application commands."))
        .catch(console.error);
}