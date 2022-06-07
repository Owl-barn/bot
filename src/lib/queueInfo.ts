import { Queue, QueueRepeatMode } from "discord-player";

export default function queueInfo(queue: Queue) {
    let length = queue.tracks.reduce((x, y) => x + y.durationMS, 0);
    const current = queue.current;

    length +=
        current.durationMS -
        Math.round(
            (queue.getPlayerTimestamp().progress / 100) * current.durationMS,
        );

    return {
        length,
        size: queue.tracks.length,
        repeat: queue.repeatMode,
        paused: queue.connection.paused,
    };
}

export interface QueueInfo {
    length: number;
    size: number;
    paused: boolean;
    repeat: QueueRepeatMode;
}
