import { state } from "@app";
import { EmbedBuilder } from "@discordjs/builders";
import { warningEmbedTemplate } from "@lib/embedTemplate";
import { AccessConfig, subscriptionTiers } from "@structs/command/subscription";

type Response =
  {
    canUse: true;
    effectiveTier: keyof typeof subscriptionTiers;
  } |
  {
    canUse: false;
    message: EmbedBuilder;
  }

export async function getAccessInfo(config: AccessConfig | undefined, userId: string, guildId?: string): Promise<Response> {
  if (!config) return { canUse: true };
  if (config.guildTier === undefined || config.individualTier === undefined) return { canUse: true };

  const guild = state.guilds.get(guildId ?? "");
  const embed = warningEmbedTemplate();
  embed.setTitle("Subscription Required");
  embed.setDescription("This command requires atleast one of the following subscriptions:");

  if (guild && config.guildTier.indexOf(guild.subscriptionTier) !== -1) return { canUse: true };
  else {
    embed.addFields([{ name: "Server subscription", value: `\`${subscriptionTiers[config.guildTier].name}\` or higher\n`, inline: true }]);
  }

  const user = await state.db.user.findUnique({ where: { id: userId } });
  if (user && config.individualTier.indexOf(user.subscription) !== -1) return { canUse: true };
  else {
    embed.addFields([{ name: "User subscription", value: `\`${subscriptionTiers.get(config.individualTier)?.name}\` or higher\n`, inline: true }]);
  }

  return { canUse: false, message: embed };
}
