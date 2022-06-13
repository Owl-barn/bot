import bot from "../app";
import queueInfo, { QueueInfo } from "../lib/queueInfo";
import Track from "../music/track";

export default async function getQueue(message: {
    data: GetQueueData;
}): Promise<response> {
    const { guildId } = message.data;
    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = player.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    let queueList = queue.getTracks();
    const nowPlaying = queue.nowPlaying();

    // temporary
    const timeStamp = {
        current: "00",
        end: nowPlaying?.durationMs ?? 0,
        progress: 20,
    };

    const current = { ...nowPlaying, ...timeStamp };

    return {
        queueInfo: queueInfo(queue),
        queue: queueList,
        current,
    };
}

interface GetQueueData {
    guildId: string;
}

interface currentTrack extends Track {
    current: string;
    end: string;
    progress: number;
}

interface response {
    queue: Track[];
    current: currentTrack;
    queueInfo: QueueInfo;
}
