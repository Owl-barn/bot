import { state } from "@app";

export async function updateSubscription(guildId: string, userId: string, subscriptionTier: number | null) {
  let relation;
  if (subscriptionTier === null) relation = { disconnect: true };
  else relation = { connect: { id: userId } };

  // Update the guild
  const guild = await state.db.guild.update({
    where: { id: guildId },
    data: { subscriptionTier, subscribedUser: relation },
  });

  state.guilds.set(guildId, guild);

  return guild;
}
