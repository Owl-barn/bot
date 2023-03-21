import { Client, GatewayIntentBits } from "discord.js";
import { state } from "@app";


const loadClient = (token: string): Promise<Client> => {
  return new Promise((resolve, reject) => {
    const client = new Client({
      intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildVoiceStates,
    });

    client.login(token)
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

            state.client = client;
            resolve(client);
          }
        });
      })
      .catch((error) => reject(error));
  });
};

export { loadClient };
