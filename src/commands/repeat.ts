import { bot } from "../app";
import RepeatMode from "../types/repeatmode";

export default async function repeat(message: {
    data: { guildId: string; repeat: RepeatMode };
}): Promise<{}> {
    const { guildId, repeat } = message.data;

    const client = bot.getClient();
    const player = client.player;

    const queue = player.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    queue.setRepeatMode(repeat);

    return { repeat };
}
