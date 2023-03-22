import fs from "fs";
import { state } from "app";
import { CommandStruct } from "@structs/command";
import { Commands } from "@structs/commands";
import { processCommand } from "@lib/processCommand";


export async function loadCommands(path: string) {
  const files = fs.readdirSync(path);
  let commandCount = 0;

  console.log(`⌛ Loading events`.green.bold);

  state.server.on("Command", processCommand);

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    if (file === "index.js") continue;
    const module = await import(`${path}/${file}`);
    const command = module.default as CommandStruct<keyof Commands>;

    commandCount++;

    state.commands.set(command.name, command);
    //state.server.on(command.name, (data) => processCommand(command.run, data));

    if (state.env.isDevelopment) {
      console.log(` - Loaded Command: ${command.name.green.italic}`.cyan.italic);
    }
  }

  console.log("✅ Loaded ".green.bold + String(commandCount).cyan.italic + " Events".green.bold);
  console.log(`----------------------------------------`.cyan.bold);
}
