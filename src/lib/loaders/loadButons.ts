import { state } from "@app";
import { ButtonStruct } from "@structs/button";
import fs from "fs";

export async function loadButtons(path: string) {
  const files = fs.readdirSync(path, { withFileTypes: true });
  const oldButtonCount = state.buttons.size;

  for (const file of files) {
    if (!file.name.endsWith(".js")) continue;
    const button = (await import(path + file.name)).default as ButtonStruct;

    if (button == undefined) continue;

    if (state.buttons.get(button.info.name) !== undefined)
      throw `duplicate buttons with name: ${button.info.name}`.red.bold;

    if (button.info.disabled) continue;

    // Add command to client.
    state.buttons.set(button.info.name, button);
    // Log.
    if (state.env.isDevelopment)
      state.log.debug(`Loaded button: ${button.info.name.green}`);
  }

  console.log(
    " - Loaded ".green +
    String(state.buttons.size - oldButtonCount).cyan +
    " buttons".green,
  );

}
