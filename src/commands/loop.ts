import { QueueRepeatMode } from "discord-player";
import bot from "../app";

export default async function loop(message: {
    data: { guildId: string; repeat: QueueRepeatMode };
}): Promise<{}> {
    const { guildId, repeat } = message.data;

    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);

    const queue = player.getQueue(guild);

    if (!queue || !queue.playing) throw "No music is playing";

    queue.setRepeatMode(repeat);

    return { repeat };
}
