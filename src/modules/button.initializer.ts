import colors from "colors";
colors.enable();

import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import RavenButton from "../types/button";

type buttonCollection = Collection<string, RavenButton>;

export async function registerButtons(): Promise<buttonCollection> {
    console.log(" > Loading buttons".green.bold);
    const buttons = new Collection() as buttonCollection;

    const files = fs.readdirSync(path.join(__dirname, "../buttons"));

    for (const file of files) {
        const buttonClass = (await import(`../buttons/${file}`)).default;
        const button = new buttonClass() as RavenButton;

        if (button == undefined) {
            continue;
        }

        if (buttons.get(button.name) !== undefined) {
            console.log(
                `duplicate commands with name: ${button.name}`.red.bold,
            );
            process.exit();
        }

        // Add command to client.
        buttons.set(button.name, button);
        // Log.
        console.log(
            `${" - Loaded button:".cyan.italic} ${
                button.disabled
                    ? button.name.red.italic
                    : button.name.green.italic
            }`,
        );
    }

    console.log(" ✓ All buttons loaded".green.bold);

    return buttons;
}
