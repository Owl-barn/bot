import { Event } from "@src/structs/event";
import { ActivityType, Client } from "discord.js";
import VCService from "../modules/privateVC.service";

export default {
  name: "ready",
  once: true,

  async execute(client: Client): Promise<void> {
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
  },

} as Event;
