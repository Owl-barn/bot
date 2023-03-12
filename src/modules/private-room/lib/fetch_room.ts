import { state } from "@app";
import { PrivateRoom } from "@prisma/client";
import { ChatInputCommandInteraction, NonThreadGuildBasedChannel, VoiceChannel } from "discord.js";

export async function fetchRoom(msg: ChatInputCommandInteraction): Promise<{ room: NonThreadGuildBasedChannel; dbRoom: PrivateRoom }> {

  const dbRoom = await state.db.privateRoom.findUnique({
    where: {
      userId_guildId: {
        userId: msg.user.id,
        guildId: msg.guildId as string,
      },
    },
  });

  if (!dbRoom) throw "noRoom";

  const room = (await msg.guild?.channels.fetch(dbRoom.mainRoomId)) as VoiceChannel;

  if (!room) {
    await state.db.privateRoom.delete({
      where: {
        userId_guildId: {
          userId: msg.user.id,
          guildId: msg.guildId as string,
        },
      },
    });

    throw "noRoom";
  }

  return { room, dbRoom };
}
