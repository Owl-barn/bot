import bot from "../app";

export default async function stop(message: {
    data: { guildId: string };
}): Promise<{}> {
    const { guildId } = message.data;

    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);

    const queue = player.getQueue(guild);

    if (!queue || !queue.playing) throw "No music is playing";

    queue.stop();

    return {};
}
