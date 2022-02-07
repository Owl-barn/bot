import colors from "colors";
import dotenv from "dotenv";
colors.enable();
dotenv.config();

import Bot from "./bot";

import GuildsController from "./routes/guilds/guilds.controller";
import LeaderboardController from "./routes/leaderboard/leaderboard.controller";
import OauthController from "./routes/oauth/oauth.controller";
import WebServer from "./web";

const web = new WebServer([new OauthController(), new GuildsController(), new LeaderboardController()]);
web.listen();

declare const global: NodeJS.Global & { bot?: Bot };
const bot: Bot = global.bot || new Bot();
if (process.env.NODE_ENV === "development") global.bot = bot;

export default bot;