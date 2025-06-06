import fs from "fs";
import { state } from "@app";
import { Module } from "@structs/module";
import { loadEvents } from "@lib/loaders/loadEvents";
import { loadCommands } from "@lib/loaders/loadCommands";
import { loadInteractables } from "@lib/loaders/loadInteractables";
import path from "path";
import { loadJobs } from "./loadJobs";
import { LocalState } from "@structs/localState";
import { loadEndpoints } from "./loadEndpoints";

export async function loadModules() {

  const modulePath = path.join(__dirname, "../../modules");

  for (const folder of fs.readdirSync(modulePath, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;

    const folderPath = `${modulePath}/${folder.name}`;
    const moduleFiles = fs.readdirSync(folderPath);

    const module = (await import(`${folderPath}/index.js`)).default as Module;
    module.path = `${folderPath}/`;

    console.log(`⌛ Loading module: ${module.name.cyan.italic}`.green.bold);


    // Set the module's logger.
    const localState = (await import(`${folderPath}/index.js`)).localState as LocalState;
    localState.log = state.log.child({ label: module.name });

    // Initialize the module's async state objects.
    if (module.initialize)
      await module.initialize()
        .catch(error => {
          throw `Failed to initialize module "${module.name}": `.red + String(error);
        });

    // Load the module's events, commands, cronjobs, and buttons.
    moduleFiles.includes("events") && await loadEvents(module.path + "events/");
    const commands = moduleFiles.includes("commands") ? await loadCommands(module.path + "commands/") : [];
    moduleFiles.includes("cron") && await loadJobs(module.path + "cron/");
    moduleFiles.includes("api") && await loadEndpoints(module.path + "api/");

    if (moduleFiles.includes("components")) {
      const componentFiles = fs.readdirSync(module.path + "components/");
      componentFiles.includes("buttons") && await loadInteractables(module.path + "components/buttons/", "buttons");
      componentFiles.includes("selectmenus") && await loadInteractables(module.path + "components/selectmenus/", "selectmenus");
    }

    // Add the module to the state object.
    state.modules.set(module.name, module);
    if (module.isHidden !== true) {
      state.commandTree.push({
        type: "Module",
        name: module.name,
        commandName: module.name,
        description: module.description,
        commands,
      });
    }

    console.log(`✅ Loaded module: ${module.name.cyan.italic}`.green.bold);
    console.log(`----------------------------------------`.cyan.bold);
  }
}
