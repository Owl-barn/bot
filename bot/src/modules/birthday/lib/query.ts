import { CommandInteraction } from "discord.js";

export function isBirthdayVisible(msg: CommandInteraction, userId: string) {
  if (userId == msg.user.id) return {} as Record<string, unknown>;
  return {
    OR: [
      { birthdayGlobalEnabled: true },
      msg.guild ? {
        UserGuildConfig: {
          some: {
            guildId: msg.guildId,
            birthdayEnabled: true,
          },
        },
      } : {},
    ],
  };
}
