import { Guild } from "discord.js";
import { Guild as PrismaGuild } from "@prisma/client";
import { state } from "@app";

export function formatGuildInfo(guild: Guild, db: PrismaGuild) {
  const owner = state.client.users.cache.get(guild.ownerId);
  const info = {
    id: guild.id,
    name: guild.name,
    owner: guild.ownerId + (owner ? ` - ${owner?.displayName}` : ""),
    membercount: guild.memberCount,
    premium: db?.subscriptionTier,
    level: db?.level,
    privateRooms: db.privateRoomChannelId !== null,
  };

  return info;
}
