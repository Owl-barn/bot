import { HexColorString } from "discord.js";
import { cleanEnv, str, url, makeValidator, num } from "envalid";
import { config } from "dotenv";
config();

const discordInvite = makeValidator((x) => {
  if (
    /(https?:\/\/)?(www.)?((discord.(gg|io|me|li))|(?:discordapp.com\/invite))\/[^\s/]+/.test(
      x,
    )
  )
    return x;
  else throw new Error("Invalid Discord invite");
});

const HexColor = makeValidator((x): HexColorString => {
  if (/^#[0-9A-F]{6}$/i.test(x)) return x as HexColorString;
  else throw new Error("Invalid HexColorString");
});

const loadEnvironment = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "staging"],
  }),

  // Main
  APP_NAME: str(),
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "verbose", "debug", "silly"],
    default: "info",
  }),

  // Database
  DATABASE_URL: url(),

  // Owlet
  OWLET_PASSWORD: str(),
  OWLET_PORT: num({ default: 3001 }),

  // Discord
  OWNER_ID: str(),
  DONATION_URL: url(),
  CLIENT_SECRET: str(),
  DISCORD_TOKEN: str(),
  SUPPORT_SERVER: discordInvite(),

  VOICE_NOTIFY_DELAY: num({ default: 90 }),
  VOICE_NOTIFY_TIMEOUT: num({ default: 1 }),

  // Private room
  ABANDON_TIMEOUT: num(),
  ALONE_TIMEOUT: num(),

  // Embed
  EMBED_COLOR: HexColor({ default: "#957f5f" }),
  EMBED_FAIL_COLOR: HexColor({ default: "#934a4a" }),
  EMBED_WARNING_COLOR: HexColor({ default: "#b7a125" }),
  EMBED_SUCCESS_COLOR: HexColor({ default: "#769352" }),
});

export { loadEnvironment };
