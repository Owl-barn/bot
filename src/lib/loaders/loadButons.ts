import { state } from "@app";
import { Button } from "@structs/button";
import fs from "fs";

export async function loadButtons(path: string) {

  const files = fs.readdirSync(path);

  for (const file of files) {
    const buttonClass = (await import(`../buttons/${file}`)).default;
    const button = new buttonClass() as Button;

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
    " ✓ Loaded ".green.bold +
    String(state.buttons.size).cyan +
    " buttons".green.bold,
  );

}
