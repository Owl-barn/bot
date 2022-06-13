import bot from "../app";

export default async function skip(message: {
    data: { guildId: string; index: number };
}): Promise<{}> {
    const { guildId, index } = message.data;

    const client = bot.getClient();
    const player = client.player;

    const queue = player.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing right now.";

    if (index !== 0 && index > queue.getTracks().length)
        throw "I couldn't find a song at that position.";

    if (index == 0) queue.skip();
    else queue.removeTrack(index - 1);

    return {};
}
