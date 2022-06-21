import { private_vc } from "@prisma/client";
import { NonThreadGuildBasedChannel } from "discord.js";
import RavenInteraction from "../types/interaction";

export default async function fetchRoom(
    msg: RavenInteraction,
): Promise<{ room: NonThreadGuildBasedChannel; dbRoom: private_vc }> {
    const dbRoom = await msg.client.db.private_vc.findUnique({
        where: {
            user_id_guild_id: {
                user_id: msg.user.id,
                guild_id: msg.guildId as string,
            },
        },
    });
    if (!dbRoom) throw "noRoom";
    const room = await msg.guild?.channels.fetch(dbRoom.main_channel_id);
    if (!room) {
        await msg.client.db.private_vc.delete({
            where: {
                user_id_guild_id: {
                    user_id: msg.user.id,
                    guild_id: msg.guildId as string,
                },
            },
        });
        throw "noRoom";
    }

    return { room, dbRoom };
}