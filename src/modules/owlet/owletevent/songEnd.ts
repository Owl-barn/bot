import { state } from "@app";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";
import { Events } from "../structs/events";
import { QueueEvent } from "../structs/queue";

type Data = Events[QueueEvent.SongStart] & {
  owletId: string;
};

const songEnd: (data: Data) => Promise<void> =
  async ({ track, guildId }) => {
    await state.db.mediaLog.create({
      data: {
        guild: connectOrCreate(guildId),
        user: connectOrCreate(track.requestedBy),
        url: track.url,

        duration: track.durationMs,
        progress: track.progressMs <= track.durationMs ? track.progressMs : track.durationMs,
      },
    });
  };

export { songEnd };
