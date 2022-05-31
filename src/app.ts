import Bot from "./bot";
import getQueue from "./commands/get_queue";
import pause from "./commands/pause";
import play from "./commands/play";
import stop from "./commands/stop";
import getStatus from "./commands/status";
import { RavenWS } from "./wsLib";
const bot = new Bot();
const ws = new RavenWS("ws:localhost:8080", "1234", bot.start, true);

ws.connect().then(async (token) => {
    const client = await bot.start(token);

    ws.send("Status", await getStatus());

    client.on("voiceStateUpdate", async (oldState, newState) => {
        if (oldState.id !== client.user?.id) return;
        const status = await getStatus();
        ws.send("Status", status);
    });

    client.on("guildCreate", async (guild) => {
        const status = await getStatus();
        ws.send("Status", status);
    });

    client.on("guildDelete", async (guild) => {
        const status = await getStatus();
        ws.send("Status", status);
    });

    client.on("guildDelete", async (guild) => {
        const status = await getStatus();
        ws.send("Status", status);
    });

    ws.on("Status", getStatus);
    ws.on("ConnectionOpened", getStatus);
    ws.on("Play", play);
    ws.on("Queue", getQueue);
    ws.on("Stop", stop);
    ws.on("Pause", pause);
});

export default bot;
