import { ActivityType } from "discord.js";
import VCService from "../modules/privateVC.service";
import RavenEvent from "../types/event";
import RavenClient from "../types/ravenClient";

export default class ready implements RavenEvent {
    name = "ready";
    once = true;

    async execute(client: RavenClient): Promise<void> {
        if (!client.user) process.exit();
        console.log(
            " ✓ Client ready, logged in as ".green.bold +
                client.user.username.cyan +
                "#".green.bold +
                client.user.discriminator.cyan +
                " (".green.bold +
                client.user.id.cyan.italic +
                ")".green.bold,
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

        // const guilds = await client.guilds.fetch();
        // const dbGuilds = await client.db.guilds.findMany();
        // const guildsToRemove = dbGuilds.filter((x) => !guilds.has(x.guild_id));

        // const count = await client.db.guilds.deleteMany({
        //     where: {
        //         guild_id: {
        //             in: guildsToRemove.map((x) => x.guild_id),
        //         },
        //     },
        // });

        // console.log(
        //     `Removed ${count.count} guilds from the database.`.yellow.italic,
        // );
    }
}
