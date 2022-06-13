import bot from "../app";
import queueInfo, { QueueInfo } from "../lib/queueInfo";
import Track, { CurrentTrack } from "../music/track";

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

    return {
        queueInfo: queueInfo(queue),
        queue: queueList,
        current: nowPlaying,
    };
}

interface GetQueueData {
    guildId: string;
}

interface response {
    queue: Track[];
    current: CurrentTrack | null;
    queueInfo: QueueInfo;
}
