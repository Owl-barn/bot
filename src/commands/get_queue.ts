import { Track, TrackJSON } from "discord-player";
import bot from "../app";
import formatTrack from "../lib/formatTrack";
import queueInfo, { QueueInfo } from "../lib/queueInfo";

export default async function getQueue(message: {
    data: GetQueueData;
}): Promise<response> {
    const { guildId } = message.data;
    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);

    if (!guild) throw "Could not find guild";

    const queue = player.getQueue(guild);

    if (!queue || !queue.playing) throw "No music is playing";

    let queueList = queue.tracks;
    const timeStamp = queue.getPlayerTimestamp();
    const nowPlaying = queue.nowPlaying().toJSON();

    const current = { ...nowPlaying, ...timeStamp };

    queueList = queueList.map((x) => formatTrack(x));

    return {
        queueInfo: queueInfo(queue),
        queue: queueList,
        current,
    };
}

interface GetQueueData {
    guildId: string;
}

interface currentSong extends TrackJSON {
    current: string;
    end: string;
    progress: number;
}

interface response {
    queue: Track[];
    current: currentSong;
    queueInfo: QueueInfo;
}
