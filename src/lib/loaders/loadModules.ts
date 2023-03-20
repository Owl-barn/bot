import fs from "fs";
import { state } from "@app";
import { Module } from "@structs/module";
import { loadEvents } from "@lib/loaders/loadEvents";
import { loadCommands } from "@lib/loaders/loadCommands";
import { loadButtons } from "@lib/loaders/loadButons";
import path from "path";
import { loadJobs } from "./loadJobs";

export async function loadModules() {

  const modulePath = path.join(__dirname, "../../modules");

  for (const folder of fs.readdirSync(modulePath, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;

    const folderPath = `${modulePath}/${folder.name}`;
    const moduleFiles = fs.readdirSync(folderPath);

    const module = (await import(`${folderPath}/index.js`)).default as Module;
    module.path = `${folderPath}/`;

    console.log(`⌛ Loading module: ${module.name.cyan.italic}`.green.bold);

    // Initialize the module's async state objects.
    if (module.initialize)
      await module.initialize()
        .catch(error => {
          throw `Failed to initialize module "${module.name}": `.red + String(error);
        });

    // Load the module's events, commands, cronjobs, and buttons.
    moduleFiles.includes("events") && await loadEvents(module.path + "events/");
    moduleFiles.includes("commands") && await loadCommands(module.path + "commands/");
    moduleFiles.includes("buttons") && await loadButtons(module.path + "buttons/");
    moduleFiles.includes("cron") && await loadJobs(module.path + "cron/");


    // Add the module to the state object.
    state.modules.set(module.name, module);
    console.log(`✅ Loaded module: ${module.name.cyan.italic}`.green.bold);
    console.log(`----------------------------------------`.cyan.bold);
  }
}
