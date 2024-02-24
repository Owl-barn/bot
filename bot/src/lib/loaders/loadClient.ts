import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import { state } from "../../app";


const loadClient = (): Promise<Client> => {
  return new Promise((resolve, reject) => {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Channel,
      ],
      allowedMentions: { parse: ["users"] },
    });

    client.login(state.env.DISCORD_TOKEN)
      .then(() => {
        client.once("ready", () => {
          if (!client.user) {
            reject("Client user not available");
          } else {
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

            state.client = client;
            resolve(client);
          }
        });
      })
      .catch((error) => reject(error));
  });
};

export { loadClient };
