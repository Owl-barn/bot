import fs from "fs";
import { state } from "app";
import { ClientEvents } from "discord.js";
import { EventStruct } from "@structs/event";


export async function loadEvents(path: string) {
  const files = fs.readdirSync(path);
  let eventCount = 0;

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const module = await import(`${path}/${file}`);
    const event = module.default as EventStruct<keyof ClientEvents>;

    if (event.once)
      state.client.once(event.name, (...args) =>
        event.execute(...args).catch(error => { state.log.error(`Error in event ${event.name}: `, { error }); }),
      );

    else
      state.client.on(event.name, (...args) =>
        event.execute(...args).catch(error => { state.log.error(`Error in event ${event.name}: `, { error }); }),
      );

    eventCount++;

    if (state.env.isDevelopment)
      state.log.debug(`Loaded Event: ${event.name.green}`);
  }

  console.log(" - Loaded ".green + String(eventCount).cyan + " events".green);
}
