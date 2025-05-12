export function connectGuildUserConfig(guildId: string, userId: string) {
  return {
    user: {
      connectOrCreate: { where: { id: userId }, create: { id: userId } }
    },
    guild: { connect: { id: guildId } },
  };
}
