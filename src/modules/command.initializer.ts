import colors from "colors";
colors.enable();

import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { CommandEnum, ParentCommand, SubCommandGroup } from "../types/Command";
import env from "./env";

export async function registerCommands(): Promise<
Collection<string, CommandEnum>
> {
  const commands = new Collection() as Collection<string, CommandEnum>;

  const folders = fs.readdirSync(path.join(__dirname, "../commands"));

  for (const folder of folders) {
    const commandFiles = fs.readdirSync(
      path.join(__dirname, `../commands/${folder}`),
    );

    for (const file of commandFiles) {
      const folderPath = path.join(
        __dirname,
        `../commands/${folder}/${file}`,
      );

      if (file.endsWith(".js")) {
        const command = await generateSimpleCommand(folderPath);
        if (!command) continue;
        commands.set(command.name, command.command);
        continue;
      }

      const command = await generateSubCommand(folderPath);

      if (!command) continue;

      for (const subCommand of command) {
        commands.set(subCommand.name, subCommand.command);
      }
    }
  }

  if (env.isDevelopment) {
    for (const command of commands.keys()) {
      console.log(
        ` - Loaded command: `.cyan.italic + command.green.italic,
      );
    }
  }

  console.log(
    " ✓ Loaded ".green.bold +
            String(commands.size).cyan +
            " commands".green.bold,
  );

  return commands;
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

  if (command == undefined) return;

  preName ? (command.name = `${preName}-${command.name}`) : null;

  return { name: command.name, command };
}

async function generateSubCommand(
  folderPath: string,
): Promise<returnType[] | undefined> {
  const commandFiles = fs.readdirSync(folderPath) as string[];

  if (commandFiles.indexOf("index.js") == -1) return;

  const mainCommandClass = (await import(`${folderPath}/index.js`)).default;

  const mainCommand = new mainCommandClass() as
        | ParentCommand
        | SubCommandGroup;

  if (!mainCommand) throw new Error("No main command found");

  const commandName = mainCommand.name;
  const commands: returnType[] = [];

  commands.push({ name: mainCommand.name, command: mainCommand });

  // Loop through all sub commands
  for (const file of commandFiles) {
    if (file == "index.js") continue;
    if (file.endsWith(".js")) {
      const command = await generateSimpleCommand(
        `${folderPath}/${file}`,
      );

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
