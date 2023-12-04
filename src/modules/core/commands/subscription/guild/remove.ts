import { embedTemplate, warningEmbedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { formatSubscriptions } from "../_lib/formatSubscription";
import { updateSubscription } from "../_lib/updateSubscription";
import { SubscriptionTierKey, subscriptionTiers } from "@structs/access/subscription";

export default SubCommand(

  // Info
  {
    name: "remove",
    description: "remove a guild from your subscription",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "guild_id",
        description: "The ID of the guild you want to remove",
        required: false,
      },
    ],

    throttling: {
      duration: 60,
      usages: 3,
    },
  },

  // Execute
  async (msg) => {
    // Get guild
    const guildId = msg.options.getString("guild_id") ?? msg.guild.id;

    // Check if user has a subscription
    const user = await state.db.user.findFirst({
      where: { id: msg.user.id, NOT: { subscriptionTier: null } },
      include: { subscribedGuilds: true },
    });

    if (!user) return { embeds: [warningEmbedTemplate("You do not currently have a subscription.")] };

    // Check if user is subscribed to that guild
    const guildSubscribed = user.subscribedGuilds.find((subscribedGuild) => subscribedGuild.id === guildId);
    if (!guildSubscribed) return { embeds: [warningEmbedTemplate("You are not subscribed to that guild.")] };
    const subscription = subscriptionTiers[user.subscriptionTier as SubscriptionTierKey];

    // Remove guild from user's subscriptions
    const removedGuild = await updateSubscription(guildId, user.id, null);
    user.subscribedGuilds = user.subscribedGuilds.filter((subscribedGuild) => subscribedGuild.id !== removedGuild.id);

    // Send success message
    const guild = await msg.client.guilds.fetch(guildId).catch(() => null);
    const embed = embedTemplate();
    embed.setTitle("Subscription");
    embed.setDescription(`You have successfully unsubscribed from "**${guild ? guild.name : guildId}**".`);
    formatSubscriptions(embed, user, subscription);

    return { embeds: [embed] };

  }
);
