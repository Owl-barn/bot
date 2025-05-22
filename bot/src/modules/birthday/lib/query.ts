export function canUserViewBirthday(guildId: string | null, target: string, self: string) {
  return self === target ? {} : isBirthdayVisible(guildId);
}

export function isBirthdayVisible(guildId: string | null) {
  return {
    OR: [
      guildId ? {
        UserGuildConfig: { some: { guildId } },
        OR: [
          { UserGuildConfig: { some: { birthdayEnabled: true } } },
          { birthdayGlobalEnabled: true },
        ],
      } : { birthdayGlobalEnabled: true },
    ],
  };
}
