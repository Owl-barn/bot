import { private_vc } from "@prisma/client";
import { state } from "@src/app";
import { ChatInputCommandInteraction, NonThreadGuildBasedChannel, VoiceChannel } from "discord.js";

export async function fetchRoom(msg: ChatInputCommandInteraction): Promise<{ room: NonThreadGuildBasedChannel; dbRoom: private_vc }> {

  const dbRoom = await state.db.private_vc.findUnique({
    where: {
      user_id_guild_id: {
        user_id: msg.user.id,
        guild_id: msg.guildId as string,
      },
    },
  });

  if (!dbRoom) throw "noRoom";

  const room = (await msg.guild?.channels.fetch(dbRoom.main_channel_id)) as VoiceChannel;

  if (!room) {
    await state.db.private_vc.delete({
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
