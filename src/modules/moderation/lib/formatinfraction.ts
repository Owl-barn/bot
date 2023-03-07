import { moderation_log, moderation_type } from "@prisma/client";
import { msToString } from "@lib/time";

export function formatInfraction(
  infraction: moderation_log,
  includeUser = false,
): string {
  let expiryString = "";

  if (infraction.expiry) {
    const dateMs = Number(infraction.expiry);
    const seconds = dateMs / 1000;
    if (infraction.moderation_type == moderation_type.timeout) {
      expiryString = `**Duration:** ${msToString(
        dateMs - Number(infraction.created),
      )}\n`;
    } else {
      expiryString = `**Expiry:** <t:${seconds}:D>\n`;
    }
  }

  const user = includeUser ? `**user:** <@!${infraction.user}>\n` : "";

  return (
    `**ID:** \`${infraction.uuid}\`\n` +
    `**type:** \`${infraction.moderation_type}\`\n` +
    user +
    `**mod:** <@!${infraction.moderator}>\n` +
    `**reason:** *${infraction.reason}*\n` +
    expiryString +
    `**Date:** <t:${Number(infraction.created) / 1000}:R>`
  );
}
