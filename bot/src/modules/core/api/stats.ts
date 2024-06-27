import { state } from "@app";
import { endpoint } from "@structs/endpoint";

export default endpoint({
  GET: {
    name: "stats",
    run: () => ({
      memberCount: state.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      guildCount: state.client.guilds.cache.size,
      uptime: state.client.uptime ?? 0 / 1000,
      memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    }),
  },
});
