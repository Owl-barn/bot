import colors from "colors";
colors.enable();

import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../types/Command";
import { ParentCommand } from "../types/ParentCommand";

export async function registerCommands(): Promise<Collection<string, Command>> {
    console.log(" > Loading commands".green.bold);
    const commands = new Collection() as Collection<string, Command>;

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

    for (const command of commands.keys()) {
        console.log(` - Loaded command: `.cyan.italic + command.green.italic);
    }

    console.log(" ✓ All commands loaded".green.bold);

    return commands;
}

interface returnType {
    name: string;
    command: Command;
}

async function generateSimpleCommand(
    commandPath: string,
    preName?: string,
): Promise<returnType | undefined> {
    const cmdClass = (await import(commandPath)).default;
    const command = new cmdClass() as Command;

    if (command == undefined) {
        return;
    }

    command.path = commandPath;

    preName ? (command.name = `${preName}_${command.name}`) : null;

    return { name: command.name, command };
}

async function generateSubCommand(
    folderPath: string,
): Promise<returnType[] | undefined> {
    const commandFiles = fs.readdirSync(folderPath) as string[];

    if (commandFiles.indexOf("index.js") == -1) return;

    const mainCommandClass = (await import(`${folderPath}/index.js`)).default;

    const mainCommand = new mainCommandClass() as ParentCommand;

    if (!mainCommand) throw new Error("No main command found");

    const commandName = mainCommand.name;
    const commands: returnType[] = [];

    // Loop through all sub commands
    for (const file of commandFiles) {
        if (file == "index.js") continue;
        if (file.endsWith(".js")) {
            const command = await generateSimpleCommand(
                `${folderPath}/${file}`,
            );

            if (!command) continue;

            commands.push({
                name: `${commandName}_${command.name}`,
                command: command.command,
            });

            continue;
        }

        const subCommands = await generateSubCommand(`${folderPath}/${file}`);
        if (!subCommands) continue;

        for (const subCommand of subCommands) {
            commands.push({
                name: `${commandName}_${subCommand.name}`,
                command: subCommand.command,
            });
        }
    }

    return commands;
}
