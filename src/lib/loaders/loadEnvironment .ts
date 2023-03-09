import { HexColorString } from "discord.js";
import { cleanEnv, str, url, makeValidator, num } from "envalid";

const discordId = makeValidator((x) => {
  if (/^[0-9]{17,19}$/.test(x)) return x.toUpperCase();
  else throw new Error("Expected two letters");
});

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
  CLIENT_ID: discordId(),
  SUPPORT_SERVER: discordInvite(),

  VOICE_NOTIFY_DELAY: num({ default: 90 }),
  VOICE_NOTIFY_TIMEOUT: num({ default: 1 }),

  // Private room
  ABANDON_TIMEOUT: num(),
  ALONE_TIMEOUT: num(),

  // Embed
  EMBED_COLOR: HexColor({ default: "#5c00ff" }),
  EMBED_FAIL_COLOR: HexColor({ default: "#ff0000" }),
  EMBED_WARNING_COLOR: HexColor({ default: "#ffa500" }),
  EMBED_SUCCESS_COLOR: HexColor({ default: "#00ff00" }),

  // Web
  URL: url(),
  API_URL: url(),
  API_KEY: str(),
  JWT_SECRET: str(),
  COOKIE_TOKEN: str(),
  PORT: num({ default: 3000 }),
});

export { loadEnvironment };
