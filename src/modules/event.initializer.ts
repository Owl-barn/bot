import fs from "fs";
import path from "path";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default async function eventInitializer(
    client: RavenClient,
): Promise<void> {
    console.log(" > Loading events".green.bold);

    const dir = path.join(__dirname, "../");
    const files = fs.readdirSync(dir + "/events/");

    for (const file of files) {
        if (!file.endsWith(".js")) continue;
        const module = await import(`${dir}/events/${file}`);
        const event = new module.default(client) as RavenEvent;

        if (event.once)
            client.once(event.name, (...args) =>
                event.execute(...args).catch(console.error),
            );
        else
            client.on(event.name, (...args) =>
                event.execute(...args).catch(console.error),
            );

        console.log(` - Loaded Event: ${event.name.green.italic}`.cyan.italic);
    }

    console.log(" ✓ All Events loaded".green.bold);
}
