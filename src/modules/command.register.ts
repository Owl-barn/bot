import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ClientUser, Guild } from "discord.js";
import { Argument, argumentType } from "../types/argument";
import { SlashCommandOptionBase } from "@discordjs/builders/dist/interactions/slashCommands/mixins/CommandOptionBase";
import RavenClient from "../types/ravenClient";
import { CommandGroup } from "../types/commandGroup";

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


export default async function registerCommand(client: RavenClient, guild: Guild): Promise<void> {
    const commandBuilder: SlashCommandBuilder[] = [];
    const commands = client.commands;
    let botGuild = await client.db.guilds.findUnique({ where: { guild_id: guild.id } });

    if (!botGuild) botGuild = await client.db.guilds.create({ data: { guild_id: guild.id } });

    for (const command of commands.values()) {
        if (command.group === CommandGroup.owner && !botGuild.dev) continue;
        let permission = true;

        let builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);

        if (command.args) {
            command.args.forEach((arg) => builder = (argumentHanlder(builder, arg)) as SlashCommandBuilder);
        }

        if (!command.args?.find(x => x.type == argumentType.subCommand || x.type == argumentType.subCommandGroup)) {
            builder.addBooleanOption(Option =>
                Option.setName("hidden")
                    .setDescription("hide result?")
                    .setRequired(false));
        }

        const limitedGroups = [CommandGroup.moderation, CommandGroup.owner];

        if (limitedGroups.includes(command.group) || (command.premium && !botGuild.premium)) {
            permission = false;
        }

        builder.setDefaultPermission(permission); // *******

        commandBuilder.push(builder);
    }

    const commandJson = commandBuilder.map(command => command.toJSON());

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);
    commandJson.forEach(command => { console.log(`${command.name}:\n${command.options.map(x => x.type).join("\n")}`); });

    await rest.put(Routes.applicationGuildCommands((client.user as ClientUser).id, guild.id), { body: commandJson })
        .then(() => console.log(`Successfully registered application commands. guild: ${guild.id} - ${guild.name}`.green))
        .catch((x) => console.error(x));

    console.log(await guild.commands.fetch());
}