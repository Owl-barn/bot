import Bot from "./bot";
import getQueue from "./commands/get_queue";
import pause from "./commands/pause";
import play from "./commands/play";
import stop from "./commands/stop";
import getStatus from "./commands/status";
import { RavenWS } from "./wsLib";
import { exit } from "process";
import repeat from "./commands/repeat";
import skip from "./commands/skip";

const bot = new Bot();
const ws = new RavenWS(
    process.env.ADDRESS as string,
    process.env.PASSWORD as string,
    process.env.NODE_ENV === "development",
);

const main = async () => {
    ws.on("Status", getStatus);
    ws.on("Play", play);
    ws.on("Loop", repeat);
    ws.on("Queue", getQueue);
    ws.on("Stop", stop);
    ws.on("Skip", skip);
    ws.on("Pause", pause);
    ws.on("Terminate", () => exit(0));
    ws.on("ConnectionOpened", getStatus);

    const token = await ws.connect();
    const client = await bot.start(token);

    const status = await getStatus();
    ws.send("Status", status);

    client.on("voiceStateUpdate", async (oldState, newState) => {
        /*
        console.log(
            `old: ${oldState.id} - ${oldState.channelId} - ${oldState.serverDeaf} - ${oldState.serverMute} `,
        );
        console.log(
            `new: ${newState.id} - ${newState.channelId} - ${newState.serverDeaf} - ${newState.serverMute} `,
        );
        */
        if (oldState.id !== newState.client.user?.id) return;
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

    const player = client.player;
};

export default bot;
main();
