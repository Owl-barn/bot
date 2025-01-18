import { Client, GatewayIntentBits } from "discord.js";
import { state } from "@app";
import { Player } from 'discord-player';


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
            const player = new Player(client);
            state.log.client.info(`Client ready, logged in as ${client.user.tag} (${client.user.id})`);
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
