import fs from "fs";
import path from "path";
import { state } from "src/app";
import { Client } from "discord.js";
import { Event } from "@src/structs/event";

export async function initializeEvents(client: Client) {
  const dir = path.join(__dirname, "../");
  const files = fs.readdirSync(dir + "/events/");

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const module = await import(`${dir}/events/${file}`);
    const event = new module.default(client) as Event;

    if (event.once)
      client.once(event.name, (...args) =>
        event.execute(...args).catch(console.error),
      );

    else
      client.on(event.name, (...args) =>
        event.execute(...args).catch(console.error),
      );

    if (state.env.isDevelopment) {
      console.log(` - Loaded Event: ${event.name.green.italic}`.cyan.italic);
    }
  }

  console.log(" ✓ Loaded ".green.bold + String(files.length).cyan + " events".green.bold);
}
