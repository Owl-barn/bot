import fs from "fs";
import path from "path";
import RavenClient from "../types/ravenClient";

export default function eventInitializer(client: RavenClient): void {
    console.log(" > Loading events".green.bold);
    const dir = path.join(__dirname, "../");
    fs.promises
        .readdir(`${dir}/events/`)
        .then(async (files) => {
            // Loop through files.
            for await (const file of files) {
                // Check if its a .js file.
                if (!file.endsWith(".js")) continue;
                // Import the file.
                await import(`${dir}/events/${file}`).then(async (module) => {
                    const event = new module.default(client);
                    client.on(event.name, (...args) => event.execute(...args));
                    console.log(` - Loaded Event: ${event.name}`.cyan.italic);
                });
            }
        }).then(() => { console.log(" ✓ All Events loaded".green.bold); });
}