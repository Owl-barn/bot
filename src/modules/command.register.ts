import { Command } from "../types/Command";

import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import Collection from "@discordjs/collection";
import { Argument, argumentType } from "../types/argument";
import { SlashCommandOptionBase } from "@discordjs/builders/dist/interactions/slashCommands/mixins/CommandOptionBase";
// SlashCommandSubcommandGroupBuilder
function argumentHanlder(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, arg: Argument) {

    function content<T extends SlashCommandOptionBase>(option: T): T {
        option.setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required);

        return option;
    }

    switch (arg.type) {
        case argumentType.mentionable:
            builder.addMentionableOption(content);
            break;
        case argumentType.channel:
            builder.addChannelOption(content);
            break;
        case argumentType.role:
            builder.addRoleOption(content);
            break;
        case argumentType.user:
            builder.addUserOption(content);
            break;
        case argumentType.string:
            builder.addStringOption(content);
            break;
        case argumentType.integer:
            builder.addIntegerOption(content);
            break;
        case argumentType.number:
            builder.addNumberOption(content);
            break;
        case argumentType.boolean:
            builder.addBooleanOption(content);
            break;
        case argumentType.subCommand:
            (builder as SlashCommandBuilder).addSubcommand((option): SlashCommandSubcommandBuilder => {
                option.setName(arg.name)
                    .setDescription(arg.description);

                if (!arg.subCommand) throw "uh oh";

                option = argumentHanlder(option, arg.subCommand) as SlashCommandSubcommandBuilder;

                return option;
            });
    }

    return builder;
}


export default function registerCommand(input: Collection<string, Command>, self: string, guild: string): void {
    const commands: SlashCommandBuilder[] = [];
    input.forEach((command) => {

        console.log(command.name);

        let builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);


        if (command.args) {
            command.args.forEach((arg) => builder = (argumentHanlder(builder, arg)) as SlashCommandBuilder);
        }

        builder.addBooleanOption(Option =>
            Option.setName("hidden")
                .setDescription("hide result?")
                .setRequired(false));

        commands.push(builder);
    });

    const commandJson = commands.map(command => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);

    rest.put(Routes.applicationGuildCommands(self, guild), { body: commandJson })
        .then(() => console.log("Successfully registered application commands."))
        .catch(console.error);
}