import { bot } from "../app";

export default async function terminate(message: {
    data: { now: boolean };
}): Promise<{}> {
    const { now } = message.data;
    const client = bot.getClient();
    const player = client.player;

    if (now) process.exit();
    else if (player.getQueues().size === 0) process.exit();
    player.softShutdown();

    setTimeout(() => {
        process.exit();
    }, 10 * 60 * 1000);

    return {};
}
