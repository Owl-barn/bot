import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class ready implements RavenEvent {
    name = "ready";
    once = true;

    async execute(client: RavenClient): Promise<void> {
        if (!client.user) process.exit();
        console.log(` ✓ Client ready, logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`.green.bold);
        const usercount = client.guilds.cache.reduce(((x: number, y) => x + y.memberCount), 0);
        await client.user.setActivity(`for ${usercount} members`, {
            type: "STREAMING",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        });

        // console.log(await client.guilds.cache.get("315428379316846592")?.commands.fetch());
    }
}