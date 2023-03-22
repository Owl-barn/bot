import { state } from "@app";
import { Button } from "@structs/button";
import fs from "fs";

export async function loadButtons(path: string) {
  const files = fs.readdirSync(path, { withFileTypes: true });
  const oldButtonCount = state.buttons.size;

  for (const file of files) {
    if (!file.name.endsWith(".js")) continue;
    const button = (await import(path + file.name)).default as Button;

    if (button == undefined) continue;

    if (state.buttons.get(button.name) !== undefined)
      throw `duplicate commands with name: ${button.name}`.red.bold;

    if (button.disabled) continue;

    // Add command to client.
    state.buttons.set(button.name, button);
    // Log.
    if (state.env.isDevelopment)
      state.log.debug(`Loaded button: ${button.name.green}`);
  }

  console.log(
    " - Loaded ".green +
    String(state.buttons.size - oldButtonCount).cyan +
    " buttons".green,
  );

}
