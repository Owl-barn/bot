import { cleanEnv, str, url, num } from "envalid";
import { config } from "dotenv";
config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "staging"],
  }),

  // Main
  PASSWORD: str(),
  ADDRESS: url(),
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "verbose", "debug", "silly"],
    default: "info",
  }),

  // Music
  IDLE_TIMEOUT: num({
    default: 120000, // 2 minutes
  }),

  // Spotify
  SP_ID: str(),
  SP_SECRET: str(),
  SP_RT: str(),
  SP_MARKET: str(),

});

export { env };
