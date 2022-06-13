import { Util, VoiceChannel } from "discord.js";
import bot from "../app";
import QueueInfo from "../lib/queueInfo";
import Track from "../music/track";

export default async function play(message: {
    data: playData;
}): Promise<{ track: Track; queueInfo: QueueInfo }> {
    const { channelId, guildId, query, userId, force } = message.data;

    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);
    const channel = (await guild.channels.fetch(channelId)) as VoiceChannel;

    if (!channel.joinable) throw "I can't join this channel";

    let queue = player.getQueue(guildId);
    if (!queue || queue.destroyed) queue = player.createQueue(channel);

    let track = await player.search(query, userId);

    if (!track) throw "Could not find a track with that name";

    if (force) queue.play(track);
    else queue.addTrack(track);

    return { track, queueInfo: QueueInfo(queue) };
}

interface playData {
    guildId: string;
    channelId: string;
    userId: string;
    force: boolean;
    query: string;
}

interface QueueInfo {
    length: number;
    size: number;
}
