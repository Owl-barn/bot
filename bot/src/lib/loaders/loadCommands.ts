import { state } from "@app";
import { CommandEnum } from "@structs/command";
import { ParentCommandStruct } from "@structs/command/parent";
import { SubCommandGroupStruct } from "@structs/command/subcommandgroup";
import fs from "fs";

function registerCommand(input: returnType) {
  const existingCommand = state.commands.get(input.name);
  if (existingCommand) {
    throw new Error(`Duplicate command name: ${input.name}, ${existingCommand.info.path} and ${input.command.info.path}`);
  }
  input.command.info.commandName = input.name;
  state.commands.set(input.name, input.command);
}

export async function loadCommands(path: string) {
  const commandFiles = fs.readdirSync(path, { withFileTypes: true });

  // Loop through top level files/folders
  const oldCommandCount = state.commands.size;

  for (const file of commandFiles) {
    const folderPath = path + file.name;

    if (file.name.startsWith("_")) continue;

    if (file.name.endsWith(".js")) {
      const command = await generateSimpleCommand(folderPath);
      if (!command) continue;
      registerCommand(command);
      continue;
    }

    if (!file.isDirectory()) continue;

    const command = await generateSubCommand(folderPath);
    if (!command) continue;

    for (const subCommand of command) {
      registerCommand(subCommand);
      // Log
      if (state.env.isDevelopment)
        state.log.debug(`Loaded command: ${subCommand.name.green}`);
    }

  }

  console.log(
    " - Loaded ".green +
    String(state.commands.size - oldCommandCount).cyan +
    " commands".green,
  );
}

interface returnType {
  name: string;
  command: CommandEnum;
}

async function generateSimpleCommand(
  commandPath: string,
  preName?: string,
): Promise<returnType | undefined> {
  const command = (await import(commandPath)).default as CommandEnum | undefined;
  if (!command) throw "No default export found for " + commandPath;

  const commandInfo = command.info;
  if (commandInfo == undefined) return;

  preName ? (commandInfo.name = `${preName}-${commandInfo.name}`) : null;
  command.info.path = commandPath;

  return { name: commandInfo.name, command };
}

async function generateSubCommand(folderPath: string): Promise<returnType[] | undefined> {
  const commandFiles = fs.readdirSync(folderPath, { withFileTypes: true });

  if (commandFiles.findIndex(file => file.name === "index.js") == -1) {
    console.warn("No index.js found in " + folderPath);
    return;
  }

  const mainCommand = (await import(`${folderPath}/index.js`)).default as
    | ParentCommandStruct
    | SubCommandGroupStruct;

  if (!mainCommand) throw "No main command found for " + folderPath;

  const commandName = mainCommand.info.name;
  const commands: returnType[] = [];

  commands.push({ name: mainCommand.info.name, command: mainCommand });

  // Loop through all sub commands
  for (const file of commandFiles) {
    if (file.name.startsWith("_")) continue;

    if (file.name === "index.js") continue;

    // If file is a js file, it is a simple command
    if (file.name.endsWith(".js")) {
      const command = await generateSimpleCommand(`${folderPath}/${file.name}`);

      if (!command) continue;
      commands.push({
        name: `${commandName}-${command.name}`,
        command: command.command,
      });

      continue;
    }

    if (!file.isDirectory()) continue;

    // If file is a folder, it is a sub command group
    const subCommands = await generateSubCommand(`${folderPath}/${file.name}`);
    if (!subCommands) continue;

    for (const subCommand of subCommands) {
      commands.push({
        name: `${commandName}-${subCommand.name}`,
        command: subCommand.command,
      });
    }
  }

  return commands;
}
