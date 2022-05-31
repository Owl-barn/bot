import bot from "../app";

export default async function stop(message: {
    data: { guildId: string; index: number };
}): Promise<{}> {
    const { guildId, index } = message.data;

    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);

    const queue = player.getQueue(guild);

    if (!queue || !queue.playing) throw "No music is playing";

    if (index > queue.tracks.length - 1) throw "Index out of bounds";

    if (index == 0) queue.skip();
    else queue.remove(index - 1);

    return {};
}
