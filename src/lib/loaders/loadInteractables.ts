import { Interactables, state } from "@app";
import fs from "fs";

export async function loadInteractables<T extends keyof Interactables>(componentPath: string, key: T) {
  type U = ReturnType<typeof state.interactables[T]["get"]>
  const files = fs.readdirSync(componentPath, { withFileTypes: true });
  const oldButtonCount = state.interactables[key].size;

  for (const file of files) {
    if (!file.name.endsWith(".js")) continue;
    const interactable = (await import(componentPath + file.name)).default as U;

    if (interactable == undefined) continue;

    if (state.interactables[key].get(interactable.info.name) !== undefined)
      throw `duplicate ${key}s with name: ${interactable.info.name}`.red.bold;

    if (interactable.info.disabled) continue;

    // Add command to client.
    (state.interactables[key] as Map<string, U>).set(interactable.info.name, interactable);
    // Log.
    if (state.env.isDevelopment)
      state.log.debug(`Loaded ${key}: ${interactable.info.name.green}`);
  }

  console.log(
    " - Loaded ".green +
    String(state.interactables[key].size - oldButtonCount).cyan +
    `${key}s`.green,
  );

}
