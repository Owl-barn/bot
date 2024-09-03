import { state } from "@app";
import type { CommandTreeItem } from "@structs/shared/web_api";
import fs from "fs/promises";
import { Dirent } from "fs";
import { CommandEnum, ExecutableCommand, GroupCommand } from "@structs/command";
import { ApplicationCommandOptionType } from "discord.js";

export async function loadCommands(path: string): Promise<CommandTreeItem[]> {
  const topLevelFiles = await fs.readdir(path, { withFileTypes: true });
  const commandTree: CommandTreeItem[] = [];
  const originalCommandCount = state.commands.size;

  for (const file of topLevelFiles) {
    const commands = await loadCommand(file);
    commands && commandTree.push(commands);
  }

  console.log(
    " - Loaded ".green +
    String(state.commands.size - originalCommandCount).cyan +
    " commands".green,
  );

  return commandTree;
}

// Register the command in the state.
function registerCommand(scope: string, command: CommandEnum<"processed">) {
  const commandExists = state.commands.get(scope);
  if (commandExists) {
    throw `Duplicate command name: ${command.info.name},
      ${commandExists.info.path}
      and ${command.info.path}`.red.bold;
  }
  state.commands.set(scope, command);
}

// Process the command to add the path and command name.
function processCommand(
  command: CommandEnum<"configured">,
  path: string,
  commandName: string
): CommandEnum<"processed"> {
  const processedCommand: CommandEnum<"processed"> = {
    info: {
      ...command.info,
      path,
      commandName,
    },
  };
  if ("run" in command) {
    (processedCommand as ExecutableCommand<"processed">).run = command.run;
  }
  return processedCommand;
}

async function loadCommand(file: Dirent, currentScope = ""): Promise<CommandTreeItem | undefined> {
  if (file.name.startsWith("_")) return;

  const path = `${file.path}/${file.name}`;

  // Command groups.
  if (file.isDirectory()) {
    const folder = await fs.readdir(path, { withFileTypes: true });

    // Module info
    const indexFile = folder.find((f) => f.name === "index.js");

    if (!indexFile) {
      throw `No index.js found in ${path}`.red.bold;
    }

    const rawIndex = (await import(`${path}/index.js`)).default as
      GroupCommand<"configured"> | undefined;

    if (!rawIndex) throw "No default export found for " + path;

    // update current scope
    currentScope = [currentScope, rawIndex.info.name].filter(Boolean).join("-");

    const index = processCommand(rawIndex, path, currentScope) as GroupCommand<"processed">;

    // Register command
    registerCommand(currentScope, index);

    // Loop over commands
    const commands: CommandTreeItem[] = [];

    for (const subFile of folder) {
      if (subFile.name === "index.js") continue;
      const result = await loadCommand(subFile, currentScope);
      result && commands.push(result);
    }

    if ("group" in index.info && index.info.group === "owner") {
      return;
    }

    return {
      type: "Group",
      name: index.info.name,
      commandName: index.info.commandName,
      description: index.info.description,
      commands,
    };
  }

  // Useable commands.
  if (file.isFile() && file.name.endsWith(".js")) {

    const rawCommand = (await import(path)).default as ExecutableCommand<"configured"> | undefined;
    if (!rawCommand) throw "No default export found for " + path;

    currentScope = [currentScope, rawCommand.info.name].filter(Boolean).join("-");

    const command = processCommand(rawCommand, path, currentScope) as ExecutableCommand<"processed">;

    // Register command
    registerCommand(currentScope, command);

    if ("group" in command.info && command.info.group === "owner") {
      return;
    }

    return {
      type: "Command",
      name: command.info.name,
      commandName: command.info.commandName,
      description: command.info.description,
      options: command.info.arguments?.map((arg) => ({
        ...arg,
        type: ApplicationCommandOptionType[arg.type as ApplicationCommandOptionType],
        required: arg.required === undefined ? false : arg.required,
        autoComplete: arg.autoComplete !== undefined,
      })),
    };
  }

  return;
}

