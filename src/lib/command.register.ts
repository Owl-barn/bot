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
import { guilds } from "@prisma/client";
import { state } from "@app";
import { CommandGroup, CommandType, CommandInfoEnum } from "@structs/command";
import { Argument } from "@structs/command/argument";
import { CommandInfo } from "@structs/command/command";
import { ParentCommandInfo } from "@structs/command/parent";
import { SubCommandInfo } from "@structs/command/subcommand";
import { SubCommandGroupInfo } from "@structs/command/subcommandgroup";
import {
  ApplicationCommandOptionType,
  Collection,
  Guild,
  REST,
  Routes,
} from "discord.js";
import { groupBy } from "./functions";

const limitedGroups = [
  CommandGroup.moderation,
  CommandGroup.owner,
  CommandGroup.management,
  CommandGroup.config,
];

function convert(commands: Collection<string, CommandInfoEnum>, guildInfo: guilds): (
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandSubcommandGroupBuilder
)[] {
  const commandzzzz = commands.map(
    (command: CommandInfoEnum, name: string): [string[], CommandInfoEnum] => [
      name.split("-"),
      command,
    ],
  );

  commandzzzz.sort((a, b) => a[0].length - b[0].length);

  const command_grouped = groupBy(
    commandzzzz,
    (a: [string[], CommandInfoEnum]) => a[0][0],
  );

  const commandsArray = [];

  for (const top_level_command_name of command_grouped.keys()) {
    const top_level_command_array = command_grouped.get(
      top_level_command_name,
    );

    if (top_level_command_array == undefined) continue;

    // Get the top level command.
    const top_level_command = top_level_command_array[0][1] as
      | CommandInfo
      | ParentCommandInfo;

    let permissions = true;
    // Make the builder.
    let builder: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandSubcommandGroupBuilder = new SlashCommandBuilder()
      .setName(top_level_command_name)
      .setDescription(top_level_command_array[0][1].description);

    if (top_level_command.group == CommandGroup.owner && !guildInfo.dev)
      continue;

    if (limitedGroups.includes(top_level_command.group))
      permissions = false;

    if (!permissions)
      (builder as SlashCommandBuilder).setDefaultMemberPermissions("0");

    // Command is a normal default command.
    if (top_level_command.type == CommandType.Default) {
      (top_level_command as CommandInfo).arguments?.forEach((argument) => {
        builder = argumentHandler(
          builder as SlashCommandBuilder,
          argument,
        );
      });
      builder = hideCommand(builder as SlashCommandBuilder);
      // Command is a parent command.
    } else if (top_level_command.type == CommandType.Parent) {
      const subCommandsByLength = groupBy(
        top_level_command_array,
        (a: [string[], CommandInfoEnum]) => a[0].length,
      );

      const subCommandsLen2 = subCommandsByLength.get(2);

      if (subCommandsLen2 == undefined) continue;

      const subOrGroupcommands = groupBy(
        subCommandsLen2,
        (command) => command[1].type,
      );

      const subcommands = subOrGroupcommands.get(
        CommandType.Subcommand,
      ) as [string[], SubCommandInfo][] | undefined;

      const subcommandGroups = subOrGroupcommands.get(
        CommandType.SubcommandGroup,
      ) as [string[], SubCommandGroupInfo][] | undefined;

      // Process the subCommands.
      subcommands?.forEach((subCommand) => {
        builder.addSubcommand(buildSubCommand(subCommand[1]));
      });

      // Process the subcommand groups.
      if (subcommandGroups == undefined) {
        commandsArray.push(builder);
        continue;
      }

      const subCommandsLen3 = subCommandsByLength.get(3) as
        | [string[], SubCommandInfo][]
        | undefined;

      if (subCommandsLen3 == undefined) {
        commandsArray.push(builder);
        continue;
      }

      const subCommandGroups = groupBy(
        subCommandsLen3,
        (a: [string[], SubCommandInfo]) => a[0].slice(0, 2).join("-"),
      );

      // Loop through the subcommand groups.
      for (const subCommandGroup of subcommandGroups) {
        const [GroupName, GroupCmd] = subCommandGroup;

        const group = subCommandGroups.get(
          GroupName.slice(0, 2).join("-"),
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

    commandsArray.push(builder);
  }

  return commandsArray;
}

function buildSubCommand(
  command: SubCommandInfo,
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

  builder = hideCommand(builder);

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

function hideCommand<T extends builderType>(builder: T): T {
  builder.addBooleanOption((option) => {
    option.setName("hidden");
    option.setDescription("Hide this command from others.");
    option.setRequired(false);
    return option;
  });

  return builder;
}

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
      if (option.type == ApplicationCommandOptionType.Number)
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

export default async function registerCommand(guild: Guild) {
  let dbGuild = await state.db.guilds.findUnique({
    where: { guild_id: guild.id },
  });

  if (!dbGuild) {
    dbGuild = await state.db.guilds.create({
      data: { guild_id: guild.id },
    });

    state.guilds.set(guild.id, dbGuild);
  }

  const commandInfo = new Collection<string, CommandInfoEnum>();
  for (const [name, command] of state.commands) commandInfo.set(name, command.info);

  const commands = convert(commandInfo, dbGuild);

  const commandJson = commands.map((command) => command.toJSON());

  const rest = new REST({ version: "10" }).setToken(state.env.DISCORD_TOKEN);

  if (!state.client.user) throw "Client user is undefined.";

  await rest
    .put(
      Routes.applicationGuildCommands(state.client.user.id, guild.id,),
      { body: commandJson },
    )
    .then(() => {
      const guildString = `${guild.id} - ${guild.name}`;
      console.log(`Successfully registered application commands. guild: ${guildString}`.green);
    })
    .catch(console.error);
}
