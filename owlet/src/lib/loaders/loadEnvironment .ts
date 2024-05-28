import { cleanEnv, str, url, num } from "envalid";
import { config } from "dotenv";
config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "staging"],
    default: "production",
  }),
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "verbose", "debug", "silly"],
    default: "info",
  }),

  // Server
  PASSWORD: str({ default: "password" }),
  ADDRESS: url({ default: "ws://hootsifer_bot:3001" }),

  // Music
  IDLE_TIMEOUT: num({
    default: 300000, // 5 minutes
    desc: "How long to wait before disconnecting from voice channel (miliseconds)",
  }),

  // Spotify
  SP_ID: str(),
  SP_SECRET: str(),
  SP_RT: str({ desc: "Spotify refresh token" }),
  SP_MARKET: str(),

});

export { env };
