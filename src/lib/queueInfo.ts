import { Queue } from "discord-player";

export default function queueInfo(queue: Queue) {
    let length = queue.tracks.reduce((x, y) => x + y.durationMS, 0);
    const current = queue.current;
    console.log(queue.getPlayerTimestamp().progress);

    length +=
        current.durationMS -
        Math.round(
            (queue.getPlayerTimestamp().progress / 100) * current.durationMS,
        );

    return {
        length,
        size: queue.tracks.length,
    };
}

export interface QueueInfo {
    length: number;
    size: number;
}
