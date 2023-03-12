import fs from "fs";
import { state } from "app";
import { ClientEvents } from "discord.js";
import { EventStruct } from "@structs/event";


export async function loadEvents(path: string) {
  const files = fs.readdirSync(path);

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const module = await import(`${path}/${file}`);
    const event = module.default as EventStruct<keyof ClientEvents>;

    if (event.once)
      state.client.once(event.name, (...args) =>
        event.execute(...args).catch(console.error),
      );

    else
      state.client.on(event.name, (...args) =>
        event.execute(...args).catch(console.error),
      );

    if (state.env.isDevelopment) {
      console.log(` - Loaded Event: ${event.name.green.italic}`.cyan.italic);
    }
  }

  console.log(" 🔵 Loaded ".green + String(files.length).cyan + " events".green);
}
