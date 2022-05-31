import { PlayerOptions, Track } from "discord-player";
import { Util, VoiceChannel } from "discord.js";
import bot from "../app";
import formatTrack from "../lib/formatTrack";
import queueInfo from "../lib/queueInfo";

export default async function play(message: {
    data: playData;
}): Promise<{ track: Track; queueInfo: queueInfo }> {
    const { channelId, guildId, query, userId } = message.data;
    console.log(message);

    const client = bot.getClient();
    const player = client.player;
    const guild = await client.guilds.fetch(guildId);
    const channel = (await guild.channels.fetch(channelId)) as VoiceChannel;
    const queueOptions: PlayerOptions = {
        leaveOnEmpty: true,
        leaveOnEnd: true,
        leaveOnStop: true,
        leaveOnEmptyCooldown: 30000,
    };

    const queue = player.createQueue(guild, queueOptions);
    queue.setRepeatMode(0);

    try {
        if (!queue.connection) await queue.connect(channel);
    } catch (e) {
        console.log(e);

        queue.destroy();
        throw "Could not join the vc";
    }

    let track = await player
        .search(query, {
            requestedBy: userId,
        })
        .then((x) => x.tracks[0]);

    if (!track) throw "Could not find a track with that name";

    await queue.play(track);

    track = formatTrack(track);

    return { track, queueInfo: queueInfo(queue) };
}

interface playData {
    channelId: string;
    guildId: string;
    userId: string;
    query: string;
}

interface queueInfo {
    length: number;
    size: number;
}
