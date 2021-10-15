import fs from "fs";
import path from "path";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default function eventInitializer(client: RavenClient): void {
    console.log(" > Loading events".green.bold);
    const dir = path.join(__dirname, "../");
    fs.promises
        .readdir(`${dir}/events/`)
        .then(async (files) => {
            for await (const file of files) {
                if (!file.endsWith(".js")) continue;
                await import(`${dir}/events/${file}`).then(async (module) => {
                    const event = new module.default(client) as RavenEvent;

                    if (event.once) client.once(event.name, (...args) => event.execute(...args));
                    else client.on(event.name, (...args) => event.execute(...args));

                    console.log(` - Loaded Event: ${event.name.green.italic}`.cyan.italic);
                });
            }
        }).then(() => { console.log(" ✓ All Events loaded".green.bold); });
}