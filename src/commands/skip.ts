import bot from "../app";
import Track from "../music/track";

export default async function skip(message: {
    data: { guildId: string; index: number };
}): Promise<{}> {
    const { guildId, index } = message.data;

    const client = bot.getClient();
    const player = client.player;

    const queue = player.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing right now.";

    let removed: Track | null;
    if (index == 0) removed = queue.skip();
    else removed = queue.removeTrack(index - 1);

    if (!removed) throw "I couldn't find that song.";

    return { track: removed };
}
