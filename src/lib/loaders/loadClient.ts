import { Client, GatewayIntentBits } from "discord.js";
import { state } from "../../app";


const loadClient = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.MessageContent,
    ],
    allowedMentions: { parse: ["users"] },
  });

  await client.login(state.env.DISCORD_TOKEN);

  state.client = client;
};

export { loadClient };
