import fs from "fs";
import { state } from "@app";
import { Module } from "@structs/module";
import { loadEvents } from "@lib/loaders/loadEvents";
import { loadCommands } from "@lib/loaders/loadCommands";
import { loadButtons } from "@lib/loaders/loadButons";

export async function loadModules() {

  for (const folder of fs.readdirSync("./modules", { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const moduleFiles = fs.readdirSync(`./modules/${folder.name}`);

    const module = (await import(`./modules/${folder}/index.js`)).default as Module;
    module.path = `./modules/${folder}/`;

    // Initialize the module's async state objects.
    if (module.initialize)
      await module.initialize()
        .catch(error => {
          throw `Failed to initialize module "${module.name}": `.red + String(error);
        });

    // Load the module's events, commands, and buttons.
    moduleFiles.includes("events") && await loadEvents(module.path + "events");
    moduleFiles.includes("commands") && await loadCommands(module.path + "commands");
    moduleFiles.includes("buttons") && await loadButtons(module.path + "buttons");


    // Add the module to the state object.
    state.modules.set(module.name, module);
    console.log(` ✓ Loaded module: ${module.name.green.italic}`.cyan.italic);
  }
}
