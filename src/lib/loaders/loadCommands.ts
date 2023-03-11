import { state } from "@app";
import { CommandEnum } from "@structs/command";
import { ParentCommandStruct } from "@structs/command/parent";
import { SubCommandGroupStruct } from "@structs/command/subcommandgroup";
import fs from "fs";


export async function loadCommands(path: string) {
  const folders = fs.readdirSync(path);

  for (const folder of folders) {
    const commandFiles = fs.readdirSync(path + folder);

    for (const file of commandFiles) {
      const folderPath = path + folder + "/" + file;

      if (file.endsWith(".js")) {
        const command = await generateSimpleCommand(folderPath);
        if (!command) continue;
        state.commands.set(command.name, command.command);
        continue;
      }

      const command = await generateSubCommand(folderPath);

      if (!command) continue;

      for (const subCommand of command) {
        state.commands.set(subCommand.name, subCommand.command);
      }
    }
  }

  if (state.env.isDevelopment) {
    for (const command of state.commands.keys()) {
      console.log(
        ` - Loaded command: `.cyan.italic + command.green.italic,
      );
    }
  }

  console.log(
    " ✓ Loaded ".green.bold +
    String(state.commands.size).cyan +
    " commands".green.bold,
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
  const cmdClass = (await import(commandPath)).default;
  const command = new cmdClass() as CommandEnum;
  const commandInfo = command.info;

  if (commandInfo == undefined) return;

  preName ? (commandInfo.name = `${preName}-${commandInfo.name}`) : null;

  return { name: commandInfo.name, command };
}

async function generateSubCommand(
  folderPath: string,
): Promise<returnType[] | undefined> {
  const commandFiles = fs.readdirSync(folderPath) as string[];

  if (commandFiles.indexOf("index.js") == -1) {
    console.warn("No index.js found in " + folderPath);
    return;
  }

  const mainCommand = (await import(`${folderPath}/index.js`))
    .default() as
    | ParentCommandStruct
    | SubCommandGroupStruct;

  if (!mainCommand) throw "No main command found for " + folderPath;

  const commandName = mainCommand.info.name;
  const commands: returnType[] = [];

  commands.push({ name: mainCommand.info.name, command: mainCommand });

  // Loop through all sub commands
  for (const file of commandFiles) {
    if (file == "index.js") continue;
    if (file.endsWith(".js")) {
      const command = await generateSimpleCommand(`${folderPath}/${file}`);

      if (!command) continue;

      commands.push({
        name: `${commandName}-${command.name}`,
        command: command.command,
      });

      continue;
    }

    const subCommands = await generateSubCommand(`${folderPath}/${file}`);
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
