import bot from "../app";

export default async function stop(message: {
    data: { guildId: string };
}): Promise<{}> {
    const { guildId } = message.data;

    const client = bot.getClient();
    const player = client.player;

    const queue = player.getQueue(guildId);

    if (!queue || queue.destroyed) throw "No music is playing";

    queue.stop();

    return {};
}
