export function isBirthdayVisible(guildId: string | null) {
  return {
    OR: [
      { birthdayGlobalEnabled: true },
      guildId ? {
        UserGuildConfig: {
          some: {
            guildId: guildId,
            birthdayEnabled: true,
          },
        },
      } : {},
    ],
  };
}
