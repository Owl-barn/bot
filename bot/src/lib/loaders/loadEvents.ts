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
      state.client.once(event.name, (...args) => eventHandler(args, event));

    else
      state.client.on(event.name, (...args) => eventHandler(args, event));

    eventCount++;

    if (state.env.isDevelopment)
      state.log.debug(`Loaded Event: ${event.name.green}`);
  }

  console.log(" - Loaded ".green + String(eventCount).cyan + " events".green);
}

function BanCheck<T extends keyof ClientEvents>(args: ClientEvents[T]): boolean {
  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "object" && "guild" in arg && arg.guild) {
      const guildConfig = state.guilds.get(arg.guild.id);

      if (!guildConfig) {
        state.log.warn(`Guild ${arg.guild.id} is not in the database!`);
        return true;
      }

      if (guildConfig.isBanned) return true;
    }
  }
  return false;
}


async function eventHandler<T extends keyof ClientEvents>(args: ClientEvents[T], event: EventStruct<keyof ClientEvents>): Promise<void> {
  try {
    if (!event.ignoreBans && BanCheck(args)) return;

    await event.execute(...args);
  } catch (error) {
    state.log.error(`Error in event ${event.name}: `, { error });
  }
}

