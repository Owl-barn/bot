import { PlayerEvents } from "discord-player";
import fs from "fs";
import path from "path";
import Client from "../types/client";
import Event from "../types/event";

export default async function eventInitializer(client: Client): Promise<void> {
    console.log(" > Loading events".green.bold);
    const player = client.player;

    const dir = path.join(__dirname, "../");
    const files = fs.readdirSync(dir + "/events/");

    for (const file of files) {
        if (!file.endsWith(".js")) continue;
        const module = await import(`${dir}/events/${file}`);
        const event = new module.default(client) as Event;

        if (event.once)
            player.once(event.name, (...args: any) => event.execute(...args));
        else player.on(event.name, (...args: any) => event.execute(...args));

        console.log(` - Loaded Event: ${event.name.green.italic}`.cyan.italic);
    }

    console.log(" ✓ All Events loaded".green.bold);
}
