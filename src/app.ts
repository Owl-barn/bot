import Bot from "./bot";
import getQueue from "./commands/get_queue";
import play from "./commands/play";
import stop from "./commands/stop";
import { RavenWS } from "./wsLib";
const bot = new Bot();
const ws = new RavenWS("ws:localhost:8080", "1234", bot.start, true);
ws.connect().then(async (token) => {
    const client = await bot.start(token);
    const status = {
        id: client.user?.id,
        uptime: process.uptime(),
        guilds: client.guilds.cache.map((x) => ({ id: x.id, channelId: "" })),
    };
    ws.send("Status", status);
    ws.on("Play", play);
    ws.on("Queue", getQueue);
    ws.on("Stop", stop);
});

export default bot;
