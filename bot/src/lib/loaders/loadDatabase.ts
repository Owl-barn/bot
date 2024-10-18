import { PrismaClient } from "@prisma/client";

export function loadDatabase() {
  return new PrismaClient().$extends({
    result: {
      // Level
      level: {
        experience: {
          needs: { messageExperience: true, voiceExperience: true },
          compute(level) {
            return level.messageExperience + level.voiceExperience;
          },
        },
      },
    },
  });
}
