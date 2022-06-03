import {
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandNumberOption,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    SlashCommandUserOption,
} from "@discordjs/builders";
import {
    ApplicationCommandOptionType,
    ClientUser,
    Collection,
    Guild,
    Routes,
} from "discord.js";
import {
    Command,
    CommandEnum,
    CommandType,
    ParentCommand,
    SubCommand,
    SubCommandGroup,
} from "../types/Command";
import { Argument } from "../types/argument";
import { REST } from "@discordjs/rest";
import RavenClient from "../types/ravenClient";
import GuildConfig, { GuildConfigs } from "../lib/guildconfig.service";
import { groupBy } from "../lib/functions";
import { CommandGroup } from "../types/commandGroup";

const limitedGroups = [CommandGroup.moderation, CommandGroup.owner];

function convert(
    commands: Collection<string, CommandEnum>,
    guildInfo: GuildConfigs,
): (
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandSubcommandGroupBuilder
)[] {
    const commandzzzz = commands.map(
        (command: CommandEnum, name: string): [string[], CommandEnum] => [
            name.split("_"),
            command,
        ],
    );

    commandzzzz.sort((a, b) => a[0].length - b[0].length);

    const command_grouped = groupBy(
        commandzzzz,
        (a: [string[], CommandEnum]) => a[0][0],
    );

    const commandsArray = [];

    for (const top_level_command_name of command_grouped.keys()) {
        const top_level_command_array = command_grouped.get(
            top_level_command_name,
        );

        if (top_level_command_array == undefined) continue;

        // Get the top level command.
        const top_level_command = top_level_command_array[0][1] as
            | Command
            | ParentCommand;

        let permissions = true;
        // Make the builder.
        let builder:
            | SlashCommandBuilder
            | SlashCommandSubcommandsOnlyBuilder
            | SlashCommandSubcommandGroupBuilder = new SlashCommandBuilder()
            .setName(top_level_command_name)
            .setDescription(top_level_command_array[0][1].description);

        if (top_level_command.group == CommandGroup.owner && !guildInfo.dev)
            continue;

        if (limitedGroups.includes(top_level_command.group))
            permissions = false;

        if (top_level_command.premium && !guildInfo.premium)
            permissions = false;

        if (!permissions)
            (builder as SlashCommandBuilder).setDefaultMemberPermissions("0");

        // Command is a normal default command.
        if (top_level_command.type == CommandType.Default) {
            (top_level_command as Command).arguments?.forEach((argument) => {
                builder = argumentHandler(
                    builder as SlashCommandBuilder,
                    argument,
                );
            });
            // Command is a parent command.
        } else if (top_level_command.type == CommandType.Parent) {
            const subCommandsByLength = groupBy(
                top_level_command_array,
                (a: [string[], CommandEnum]) => a[0].length,
            );

            const subCommandsLen2 = subCommandsByLength.get(2);

            if (subCommandsLen2 == undefined) continue;

            const subOrGroupcommands = groupBy(
                subCommandsLen2,
                (command) => command[1].type,
            );

            const subcommands = subOrGroupcommands.get(
                CommandType.Subcommand,
            ) as [string[], SubCommand][] | undefined;

            const subcommandGroups = subOrGroupcommands.get(
                CommandType.SubcommandGroup,
            ) as [string[], SubCommandGroup][] | undefined;

            // Process the subCommands.
            subcommands?.forEach((sub_command) => {
                builder = builder.addSubcommand(
                    buildSubCommand(sub_command[1]),
                );
            });

            // Process the subcommand groups.
            if (subcommandGroups == undefined) continue;

            const subCommandsLen3 = subCommandsByLength.get(3) as
                | [string[], SubCommand][]
                | undefined;

            if (subCommandsLen3 == undefined) continue;

            const subCommandGroups = groupBy(
                subCommandsLen3,
                (a: [string[], SubCommand]) => a[0].slice(0, 2).join("_"),
            );

            // Loop through the subcommand groups.
            for (const subCommandGroup of subcommandGroups) {
                const [GroupName, GroupCmd] = subCommandGroup;

                const group = subCommandGroups.get(
                    GroupName.slice(0, 2).join("_"),
                );

                if (group == undefined) continue;

                const groupBuilder = new SlashCommandSubcommandGroupBuilder();

                groupBuilder.setName(GroupCmd.name);
                groupBuilder.setDescription(GroupCmd.description);

                if (GroupCmd.nameLocalization)
                    groupBuilder.setNameLocalizations(
                        GroupCmd.nameLocalization,
                    );

                if (GroupCmd.descriptionLocalization)
                    groupBuilder.setDescriptionLocalizations(
                        GroupCmd.descriptionLocalization,
                    );

                group.forEach((subCommand) => {
                    groupBuilder.addSubcommand(buildSubCommand(subCommand[1]));
                });

                builder.addSubcommandGroup(groupBuilder);
            }
        }
        if (top_level_command.name == "skip") console.log(builder);

        commandsArray.push(builder);
    }

    return commandsArray;
}

function buildSubCommand(
    command: SubCommand,
    builderInput?: SlashCommandSubcommandBuilder,
) {
    let builder = builderInput || new SlashCommandSubcommandBuilder();

    builder.setName(command.name);
    builder.setDescription(command.description);

    if (command.nameLocalization)
        builder.setNameLocalizations(command.nameLocalization);
    if (command.descriptionLocalization)
        builder.setDescriptionLocalizations(command.descriptionLocalization);

    command.arguments?.forEach((argument) => {
        builder = argumentHandler(builder, argument);
    });

    return builder;
}

type OptionBuilder =
    | SlashCommandMentionableOption
    | SlashCommandChannelOption
    | SlashCommandRoleOption
    | SlashCommandUserOption
    | SlashCommandStringOption
    | SlashCommandIntegerOption
    | SlashCommandNumberOption
    | SlashCommandBooleanOption;

type builderType = SlashCommandBuilder | SlashCommandSubcommandBuilder;

function argumentHandler<T extends builderType>(
    builder: T,
    argument: Argument,
): T {
    function argumentOptionHandler<V extends OptionBuilder>(option: V): V {
        option
            .setName(argument.name)
            .setDescription(argument.description)
            .setRequired(argument.required ? true : false);

        argument.nameLocalization &&
            option.setNameLocalizations(argument.nameLocalization);
        argument.descriptionLocalization &&
            option.setNameLocalizations(argument.descriptionLocalization);

        if (
            option.type == ApplicationCommandOptionType.Integer ||
            option.type == ApplicationCommandOptionType.Number
        ) {
            if (argument.min !== undefined) option.setMinValue(argument.min);
            if (argument.max !== undefined) option.setMaxValue(argument.max);
        }

        if (argument.choices) {
            if (option.type == ApplicationCommandOptionType.String)
                option.setChoices(...(argument as Argument<string>).choices);
            if (option.type == ApplicationCommandOptionType.Integer)
                option.setChoices(...(argument as Argument<number>).choices);
        }

        if (argument.autoComplete) {
            if (
                option.type == ApplicationCommandOptionType.String ||
                option.type == ApplicationCommandOptionType.Number ||
                option.type == ApplicationCommandOptionType.Integer
            )
                option.setAutocomplete(true);
        }

        return option;
    }

    switch (argument.type) {
        case ApplicationCommandOptionType.Mentionable:
            builder.addMentionableOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.Channel:
            builder.addChannelOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.Role:
            builder.addRoleOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.User:
            builder.addUserOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.String:
            builder.addStringOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.Integer:
            builder.addIntegerOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.Number:
            builder.addNumberOption(argumentOptionHandler);
            break;
        case ApplicationCommandOptionType.Boolean:
            builder.addBooleanOption(argumentOptionHandler);
            break;
    }

    return builder;
}

export default async function registerCommand(
    client: RavenClient,
    guild: Guild,
): Promise<void> {
    let dbGuild = await client.db.guilds.findUnique({
        where: { guild_id: guild.id },
    });

    if (!dbGuild)
        dbGuild = await client.db.guilds.create({
            data: { guild_id: guild.id },
        });

    const guildconfig = GuildConfig.getGuild(guild.id);
    if (!guildconfig) return;

    const commands = convert(client.commands, guildconfig);

    const commandJson = commands.map((command) => command.toJSON());

    const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN as string,
    );

    await rest
        .put(
            Routes.applicationGuildCommands(
                (client.user as ClientUser).id,
                guild.id,
            ),
            { body: commandJson },
        )
        .then(() => {
            const guildString = `${guild.id} - ${guild.name}`;
            console.log(
                (
                    "Successfully registered application commands. guild:" +
                    guildString
                ).green,
            );
        })
        .catch((x) => console.error(x));
}
