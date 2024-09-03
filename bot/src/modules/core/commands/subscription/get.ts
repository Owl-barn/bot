import { state } from "@app";
import { embedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { SubscriptionTierKey, subscriptionTiers } from "@structs/access/subscription";
import { SubCommand } from "@structs/command/subcommand";
import { formatSubscriptions } from "./_lib/formatSubscription";

export default SubCommand(

  // Info
  {
    name: "get",
    description: "View your current subscription.",

    isGlobal: true,

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    const user = await state.db.user.findUnique({
      where: { id: msg.user.id },
      include: { subscribedGuilds: true },
    });

    if (!user || user.subscriptionTier === null) return { embeds: [warningEmbedTemplate("You do not currently have a subscription.")] };

    const subscribedSince = user.subscribedSince ? Math.round(Number(user.subscribedSince) / 1000) : null;
    const embed = embedTemplate();
    embed.setTitle("Your subscription");
    embed.setDescription(
      `Your current subscription is \`${subscriptionTiers[user.subscriptionTier as SubscriptionTierKey].name}\`.\n`
      + (subscribedSince ? `And you have been subscribed <t:${subscribedSince}:R>.` : "")
    );

    const subscription = subscriptionTiers[user.subscriptionTier as SubscriptionTierKey];
    formatSubscriptions(embed, user, subscription);

    return { embeds: [embed] };
  }
);
