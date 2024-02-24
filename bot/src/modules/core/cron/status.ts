import { state } from "@app";
import { cron } from "@structs/cron";
import { ActivityType } from "discord.js";

export default cron(
  {
    name: "botStatus",
    time: "0 * * * *",
  },

  async () => {
    const client = state.client;
    if (!client.user) throw "No client user???";

    const usercount = client.guilds.cache.reduce(
      (x: number, y) => x + y.memberCount,
      0,
    );

    client.user.setActivity(`for ${usercount} members`, {
      type: ActivityType.Streaming,
      url: "https://www.youtube.com/watch?v=VZrDxD0Za9I",
    });

  },
);
