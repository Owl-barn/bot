import { Command } from "../types/Command";

import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Collection } from "discord.js";
import { Argument, argumentType } from "../types/argument";
import { SlashCommandOptionBase } from "@discordjs/builders/dist/interactions/slashCommands/mixins/CommandOptionBase";

function addSubcommand<B extends SlashCommandSubcommandGroupBuilder | SlashCommandBuilder>(builder: B, arg: Argument): B {
    builder.addSubcommand((option): SlashCommandSubcommandBuilder => {
        option.setName(arg.name);
        option.setDescription(arg.description);

        if (arg.subCommands && arg.subCommands.length !== 0) {
            arg.subCommands.forEach(x => option = argumentHanlder(option, x) as SlashCommandSubcommandBuilder);
        }

        option.addBooleanOption(Option =>
            Option.setName("hidden")
                .setDescription("hide result?")
                .setRequired(false));

        return option;
    });

    return builder;
}

function argumentHanlder(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder, arg: Argument) {
    function content<T extends SlashCommandOptionBase>(option: T): T {
        option.setName(arg.name)
            .setDescription(arg.description)
            .setRequired(arg.required ? true : false);

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
            builder = addSubcommand(builder as SlashCommandBuilder, arg);
            break;
        case argumentType.subCommandGroup:
            builder = (builder as SlashCommandBuilder)
                .addSubcommandGroup((option): SlashCommandSubcommandGroupBuilder => {
                    option.setName(arg.name);
                    option.setDescription(arg.description);
                    if (!arg.subCommands) throw "missing subcommands in group!??";
                    for (const subcommand of arg.subCommands) {
                        option = addSubcommand(option as SlashCommandSubcommandGroupBuilder, subcommand);
                    }

                    return option;
                }) as SlashCommandBuilder;

    }

    return builder;
}


export default function registerCommand(input: Collection<string, Command>, self: string, guild: string): void {
    const commands: SlashCommandBuilder[] = [];

    input.forEach((command) => {

        if (command.group == "owner" && command.name !== "stats") return;
        if (command.name === "config") return;

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

        if (command.group === "owner") builder.setDefaultPermission(false);

        if (command.group === "moderation") builder.setDefaultPermission(false);

        commands.push(builder);
    });

    const commandJson = commands.map(command => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);

    rest.put(Routes.applicationGuildCommands(self, guild), { body: commandJson })
        .then(() => console.log("Successfully registered application commands."))
        .catch(() => console.error);
}