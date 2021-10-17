import colors from "colors";
colors.enable();

import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../types/Command";

export async function registerCommands(): Promise<Collection<string, Command>> {
    console.log(" > Loading commands".green.bold);
    const commands = new Collection() as Collection<string, Command>;

    const folders = fs.readdirSync(path.join(__dirname, "../commands"));

    for (const folder of folders) {
        const commandFiles = fs.readdirSync(path.join(__dirname, `../commands/${folder}`)).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            const cmdClass = (await import(`../commands/${folder}/${file}`)).default;
            const command = new cmdClass() as Command;

            if (command == undefined) { continue; }

            command.path = `/${folder}/${file}`;

            if (commands.get(command.name) !== undefined) {
                console.log(`duplicate commands with name: ${command.name}`.red.bold);
                process.exit();
            }

            // Add command to client.
            commands.set(command.name, command);
            // Log.
            console.log(`${" - Loaded Command:".cyan.italic} ${command.disabled ? command.name.red.italic : command.name.green.italic}`);
        }
    }

    console.log(" ✓ All commands loaded".green.bold);

    return commands;
}