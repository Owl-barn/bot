import { AudioPlayerStatus } from "@discordjs/voice";
import Queue from "../music/queue";
import RepeatMode from "../types/repeatmode";

export default function queueInfo(queue: Queue) {
    const tracks = queue.getTracks();
    let length = tracks.reduce((x, y) => x + y.durationMs, 0);
    const current = queue.nowPlaying();

    // length +=
    //     current.durationMs -
    //     Math.round(
    //         (queue.getPlayerTimestamp().progress / 100) * current.durationMs,
    //     );

    return {
        length,
        size: tracks.length,
        repeat: queue.getRepeatMode(),
        paused: queue.player.state.status === AudioPlayerStatus.Paused,
    };
}

export interface QueueInfo {
    length: number;
    size: number;
    paused: boolean;
    repeat: RepeatMode;
}
