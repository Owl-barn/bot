import colors from "colors";
colors.enable();

import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import RavenButton from "../types/button";
import env from "./env";

type buttonCollection = Collection<string, RavenButton>;

export async function registerButtons(): Promise<buttonCollection> {
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
        if (env.isDevelopment) {
            console.log(
                `${" - Loaded button:".cyan.italic} ${
                    button.disabled
                        ? button.name.red.italic
                        : button.name.green.italic
                }`,
            );
        }
    }

    console.log(
        " ✓ Loaded ".green.bold +
            String(buttons.size).cyan +
            " buttons".green.bold,
    );

    return buttons;
}
