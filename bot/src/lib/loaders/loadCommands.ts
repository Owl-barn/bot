import { state } from "@app";
import { CommandEnum } from "@structs/command";
import { ParentCommandStruct } from "@structs/command/parent";
import { SubCommandGroupStruct } from "@structs/command/subcommandgroup";
import { CommandTreeModule } from "@structs/command/tree";
import fs from "fs/promises";
import { Dirent } from "fs";
import { CommandStruct } from "@structs/command/command";
import { SubCommandStruct } from "@structs/command/subcommand";

export async function loadCommands(path: string): Promise<CommandTreeModule[]> {
  const topLevelFiles = await fs.readdir(path, { withFileTypes: true });
  const commandTree: CommandTreeModule[] = [];

  for (const file of topLevelFiles) {
    const commands = await loadCommand(file);
    commands && commandTree.push(commands);
  }

  console.log(
    " - Loaded ".green +
    String(state.commands.size).cyan +
    " commands".green,
  );

  return commandTree;
}

async function loadCommand(file: Dirent, currentScope = ""): Promise<CommandTreeModule | undefined> {
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

    const index = (await import(`${path}/index.js`)).default as
      | ParentCommandStruct
      | SubCommandGroupStruct;

    if (!index) throw "No default export found for " + path;

    // update current scope
    currentScope = [currentScope, index.info.name].filter(Boolean).join("-");

    // Loop over commands
    let commands: CommandTreeModule[] | undefined = [];

    for (const subFile of folder) {
      if (subFile.name === "index.js") continue;
      const result = await loadCommand(subFile, currentScope);
      result && commands.push(result);
    }

    if (commands.length === 0) commands = undefined;

    return {
      type: index.info.type,
      name: index.info.name,
      description: index.info.description,
      commands,
    };
  }

  // Useable commands.
  if (file.isFile() && file.name.endsWith(".js")) {

    const command = (await import(path)).default as CommandStruct | SubCommandStruct | undefined;
    if (!command) throw "No default export found for " + path;

    currentScope = [currentScope, command.info.name].filter(Boolean).join("-");

    // Check and add to global state
    const commandExists = state.commands.get(currentScope);
    if (commandExists) {
      throw `Duplicate command name: ${command.info.name},
        ${commandExists.info.path}
        and ${command.info.path}`.red.bold;
    }

    state.commands.set(currentScope, command);

    // Populate command info
    command.info.path = path;
    command.info.commandName = currentScope;

    return {
      type: command.info.type,
      name: command.info.name,
      description: command.info.description,
    };
  }

  return;
}

