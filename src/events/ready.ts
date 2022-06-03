import { ActivityType } from "discord.js";
import VCService from "../lib/privateVC.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class ready implements RavenEvent {
    name = "ready";
    once = true;

    async execute(client: RavenClient): Promise<void> {
        if (!client.user) process.exit();
        console.log(
            ` ✓ Client ready, logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`
                .green.bold,
        );
        const usercount = client.guilds.cache.reduce(
            (x: number, y) => x + y.memberCount,
            0,
        );
        client.user.setActivity(`for ${usercount} members`, {
            type: ActivityType.Streaming,
            url: "https://www.youtube.com/watch?v=VZrDxD0Za9I",
        });

        VCService.initialize(client);
    }
}
