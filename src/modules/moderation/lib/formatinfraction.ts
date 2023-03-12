import { Infraction, ModerationType } from "@prisma/client";
import { msToString } from "@lib/time";

export function formatInfraction(
  infraction: Infraction,
  includeUser = false,
): string {
  let expiresOnString = "";

  if (infraction.expiresOn) {
    const dateMs = Number(infraction.expiresOn);
    const seconds = dateMs / 1000;
    if (infraction.moderationType == ModerationType.timeout) {
      expiresOnString = `**Duration:** ${msToString(
        dateMs - Number(infraction.createdAt),
      )}\n`;
    } else {
      expiresOnString = `**expiresOn:** <t:${seconds}:D>\n`;
    }
  }

  const user = includeUser ? `**user:** <@!${infraction.userId}>\n` : "";

  return (
    `**ID:** \`${infraction.id}\`\n` +
    `**type:** \`${infraction.moderationType}\`\n` +
    user +
    `**mod:** <@!${infraction.moderatorId}>\n` +
    `**reason:** *${infraction.reason}*\n` +
    expiresOnString +
    `**Date:** <t:${Math.round(Number(infraction.createdAt) / 1000)}:R>`
  );
}
