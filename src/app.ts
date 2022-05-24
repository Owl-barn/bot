import colors from "colors";
import dotenv from "dotenv";
import bot from "./bot";
colors.enable();
dotenv.config();

import GuildsController from "./routes/guilds/guilds.controller";
import LeaderboardController from "./routes/leaderboard/leaderboard.controller";
import OauthController from "./routes/oauth/oauth.controller";
import WebServer from "./web";

const web = new WebServer([
    new OauthController(),
    new GuildsController(),
    new LeaderboardController(),
]);
web.listen();
bot;
