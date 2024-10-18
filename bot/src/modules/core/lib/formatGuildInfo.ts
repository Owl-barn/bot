import { Guild } from "discord.js";
import { Guild as PrismaGuild } from "@prisma/client";
import { state } from "@app";

export function formatGuildInfo(guild: Guild, db: PrismaGuild) {
  const owner = state.client.users.cache.get(guild.ownerId);
  const subscriber = db.subscribedUserId && state.client.users.cache.get(db.subscribedUserId);
  const info = {
    id: guild.id,
    name: guild.name,
    owner: guild.ownerId + (owner ? ` - ${owner?.displayName}` : ""),
    membercount: guild.memberCount,
    premium: db?.subscriptionTier,
    premiumUser: db.subscribedUserId
      ? db.subscribedUserId + (subscriber ? ` - ${subscriber?.displayName}` : "")
      : undefined,
    level: db?.levelSystemEnabled,
    privateRooms: db.privateRoomChannelId !== null,
  };

  return info;
}
