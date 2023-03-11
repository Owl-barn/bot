import { Event } from "@structs/event";
import { ActivityType } from "discord.js";

export default Event({
  name: "ready",
  once: true,

  async execute(client) {

    if (!client.user) process.exit();
    console.log(
      " ✓ Client ready, logged in as ".green.bold +
      client.user.tag.cyan +
      " (".green.bold + client.user.id.cyan.italic + ")".green.bold,
    );
    const usercount = client.guilds.cache.reduce(
      (x: number, y) => x + y.memberCount,
      0,
    );

    client.user.setActivity(`for ${usercount} members`, {
      type: ActivityType.Streaming,
      url: "https://www.youtube.com/watch?v=VZrDxD0Za9I",
    });

  },

});
