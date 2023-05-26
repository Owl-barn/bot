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
    default: "production",
  }),

  // Main
  APP_NAME: str({ default: "Hootsifer" }),
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "verbose", "debug", "silly"],
    default: "info",
  }),

  // Database
  DATABASE_URL: url({
    default: "postgresql://postgres:password@postgres:5432/postgres",
    desc: "Postgres database URL",
  }),

  // Discord
  OWNER_ID: str(),
  DONATION_URL: url(),
  CLIENT_SECRET: str(),
  DISCORD_TOKEN: str(),
  SUPPORT_SERVER: discordInvite(),

  // Owlet
  OWLET_PASSWORD: str({
    default: "password",
    desc: "Owlet password",
  }),
  OWLET_PORT: num({ default: 3001 }),

  // Notify
  VOICE_NOTIFY_COOLDOWN: num({
    default: 5400, // 1.5 hours
    desc: "Cooldown between voice notifications (seconds)",
  }),
  VOICE_NOTIFY_DELAY: num({
    default: 60,
    desc: "Delay before voice notifications (seconds)",
  }),

  // Private room
  ROOM_ABANDON_TIMEOUT: num({
    default: 180,
    desc: "Time a private room has to be empty for before it is deleted (seconds)",
  }),
  ROOM_ALONE_TIMEOUT: num({
    default: 300,
    desc: "Max amount of time a user is allowed to be alone in a room for before it is deleted (seconds)",
  }),

  // Embed
  EMBED_COLOR: HexColor({ default: "#957f5f" }),
  EMBED_FAIL_COLOR: HexColor({ default: "#934a4a" }),
  EMBED_WARNING_COLOR: HexColor({ default: "#b7a125" }),
  EMBED_SUCCESS_COLOR: HexColor({ default: "#769352" }),
});

export { loadEnvironment };
