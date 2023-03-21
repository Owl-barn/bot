import { cleanEnv, str, url } from "envalid";
import { config } from "dotenv";
config();

const loadEnvironment = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "staging"],
  }),

  // Main
  PASSWORD: str(),
  ADDRESS: url(),

  // Spotify
  SP_ID: str(),
  SP_SECRET: str(),
  SP_RT: str(),
  SP_MARKET: str(),

});

export { loadEnvironment };
