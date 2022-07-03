import colors from "colors";
import bot from "./bot";
import env from "./modules/env";

colors.enable();

import GuildsController from "./routes/guilds/guilds.controller";
import LeaderboardController from "./routes/leaderboard/leaderboard.controller";
import OauthController from "./routes/oauth/oauth.controller";
import WebServer from "./web";

env;

const web = new WebServer([
    new OauthController(),
    new GuildsController(),
    new LeaderboardController(),
]);
web.listen();

bot;
