import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ApplicationCommandPermissionData, Guild } from "discord.js";
import { Argument, argumentType } from "../types/argument";
import { SlashCommandOptionBase } from "@discordjs/builders/dist/interactions/slashCommands/mixins/CommandOptionBase";
import RavenClient from "../types/ravenClient";
import { CommandGroup } from "../types/commandGroup";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
import { permissions_type } from "@prisma/client";

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
        if (command.group === CommandGroup.owner) continue;
        let permission = true;

        let builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);

        if (command.args) {
            command.args.forEach((arg) => builder = (argumentHanlder(builder, arg)) as SlashCommandBuilder);
        }

        const limitedGroups = [CommandGroup.moderation, CommandGroup.owner];

        builder.addBooleanOption(Option =>
            Option.setName("hidden")
                .setDescription("hide result?")
                .setRequired(false));

        if (limitedGroups.includes(command.group) || (command.premium && !botGuild.premium)) {
            permission = false;
        }

        builder.setDefaultPermission(permission);
        commandBuilder.push(builder);
    }

    const commandJson = commandBuilder.map(command => command.toJSON());

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);

    await rest.put(Routes.applicationGuildCommands(client.user!.id, guild.id), { body: commandJson })
        .then(() => console.log(`Successfully registered application commands. guild: ${guild.id} - ${guild.name}`.green))
        .catch(() => console.error);
}

export async function registerPerms(client: RavenClient, guild: Guild): Promise<void> {
    const botOwner = {
        id: process.env.OWNER_ID as string,
        type: ApplicationCommandPermissionTypes.USER,
        permission: true,
    };

    const serverOwner = {
        id: guild.ownerId as string,
        type: ApplicationCommandPermissionTypes.USER,
        permission: true,
    };

    const commands = client.commands;
    const dbPerms = await client.db.permissions.findMany({ where: { guild_id: guild.id } });

    const interactions = await guild.commands.fetch();


    for (const interaction of interactions.values()) {
        const command = commands.get(interaction.name);
        const permissions = dbPerms.filter((x) => x.command === command?.name);
        const permList: ApplicationCommandPermissionData[] = [];

        if (interaction.defaultPermission) continue;

        permList.push(botOwner);
        if (command?.group !== "owner") permList.push(serverOwner);

        for (const perm of permissions) {
            permList.push({
                id: perm.target,
                type: perm.type === permissions_type.ROLE ? ApplicationCommandPermissionTypes.ROLE : ApplicationCommandPermissionTypes.USER,
                permission: perm.permission,
            });
        }

        await interaction.permissions.set({ permissions: permList }).catch(() => console.log("permission set fail".red));

    }

    console.log(`Successfully registered application perms. guild: ${guild.id} - ${guild.name}`.green);
}