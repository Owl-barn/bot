import { buildBaseCommand, ExtendedBuilderType } from "./common";
import { state } from "@app";
import { CommandType } from "@structs/command";
import { CommandContext } from "@structs/command/context";
import { SubCommandInfo } from "@structs/command/subcommand";
import { CommandTreeItem } from "@structs/shared/web_api";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";

export function findContext(command: CommandTreeItem): CommandContext | undefined {
  const commandInfo = state.commands.get(command.commandName)?.info;
  if (!commandInfo) throw `Command not found: ${command.commandName}`;
  if ("context" in commandInfo && commandInfo.context) return commandInfo.context;
  if ("commands" in command) {
    for (const subcommand of command.commands) {
      const context = findContext(subcommand);
      if (context) return context;
    }
  }
}

export function convertCommandToBuilder<T extends ExtendedBuilderType>(commandTreeItem: CommandTreeItem, builder?: T) {
  const command = state.commands.get(commandTreeItem.commandName)?.info;
  if (!command) throw `Command not found: ${commandTreeItem.commandName}`;

  // top level group
  if (command.type === CommandType.Parent) {
    let outputBuilder = new SlashCommandBuilder();
    outputBuilder = buildBaseCommand(command, outputBuilder);
    if (!("commands" in commandTreeItem)) throw "Parent command does not have any subcommands.";

    for (const subcommand of commandTreeItem.commands) {
      outputBuilder = convertCommandToBuilder(subcommand, outputBuilder);
    }
    return outputBuilder;
  }

  // subcommand group
  if (command.type === CommandType.SubcommandGroup) {
    if (!(builder instanceof SlashCommandBuilder)) throw "Group is not in a valid command builder.";
    if (!("commands" in commandTreeItem)) throw "Subcommand group does not have any subcommands.";
    const outputBuilder = builder as SlashCommandBuilder;
    outputBuilder.addSubcommandGroup((subcommandGroup) => {
      subcommandGroup = buildBaseCommand(command, subcommandGroup);
      for (const subcommand of commandTreeItem.commands) {
        subcommandGroup = convertCommandToBuilder(subcommand, subcommandGroup) as SlashCommandSubcommandGroupBuilder;
      }
      return subcommandGroup;
    });

    return outputBuilder;

  }

  // subcommand
  if (command.type === CommandType.Subcommand && builder) {
    if (command.type !== CommandType.Subcommand) throw "command is not a subcommand.";
    const outputBuilder = builder as SlashCommandBuilder | SlashCommandSubcommandGroupBuilder;
    outputBuilder.addSubcommand(buildBaseCommand(command as SubCommandInfo<"processed">, new SlashCommandSubcommandBuilder()));
    return builder;
  }

  // top level command
  if (command.type === CommandType.Default) {
    let outputBuilder = new SlashCommandBuilder();
    outputBuilder = buildBaseCommand(command, outputBuilder);

    return outputBuilder;
  }

  console.log({ commandTreeItem, command });

  throw `Invalid command type`;
}
