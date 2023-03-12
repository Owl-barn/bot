import { state } from "@app";
import { Button } from "@structs/button";
import fs from "fs";

export async function loadButtons(path: string) {

  const files = fs.readdirSync(path, { withFileTypes: true });

  for (const file of files) {
    if (!file.name.endsWith(".js")) continue;
    const button = (await import(path + file.name)).default as Button;

    if (button == undefined) {
      continue;
    }

    if (state.buttons.get(button.name) !== undefined)
      throw `duplicate commands with name: ${button.name}`.red.bold;


    // Add command to client.
    state.buttons.set(button.name, button);
    // Log.
    if (state.env.isDevelopment) {
      console.log(
        `${" - Loaded button:".cyan.italic}${button.disabled
          ? button.name.red.italic
          : button.name.green.italic
        }`,
      );
    }
  }

  console.log(
    " 🔵 Loaded ".green +
    String(state.buttons.size).cyan +
    " buttons".green,
  );

}
