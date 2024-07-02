import { state } from "@app";
import { CommandType, ExecutableCommand } from "@structs/command";
import { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

type Input = ChatInputCommandInteraction | AutocompleteInteraction;

export function getCommand(msg: Input): ExecutableCommand<"processed"> {
  let { commandName } = msg;
  const subCommandGroup = msg.options.getSubcommandGroup(false);
  const subCommand = msg.options.getSubcommand(false);

  subCommandGroup ? (commandName += `-${subCommandGroup}`) : null;
  subCommand ? (commandName += `-${subCommand}`) : null;

  const command = state.commands.get(commandName) as ExecutableCommand<"processed">;
  if (!command) throw new Error(`Command ${commandName} not found`);
  if (command.info.type !== CommandType.Default && command.info.type !== CommandType.Subcommand)
    throw new Error(`Command ${commandName} is not a executable command`);

  if (command.info.isGlobal === false && !msg.inCachedGuild()) throw new Error("Guild not cached");

  return command;
}
