import { state } from "@app";
import { connectOrCreate } from "@lib/prisma/connectOrCreate";

export async function getLevelData(guildId: string, userId: string) {
  let levelData = await state.db.level.findUnique({
    where: {
      userId_guildId: { guildId, userId },
    },
  });

  if (!levelData)
    levelData = await state.db.level.create({
      data: {
        user: connectOrCreate(userId),
        guild: connectOrCreate(guildId),
      },
    });

  return levelData;
}
